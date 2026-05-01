using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Dtos;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[ApiController]
[Authorize(Roles = "Manager,Employe")]
[Route("api/demandes-conge")]
public class DemandesCongeController : ControllerBase
{
    private readonly AppDbContext _context;
    public DemandesCongeController(AppDbContext context) => _context = context;

    // GET /api/demandes-conge
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DemandeCongeDto>>> GetAll()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = CurrentUserId();

        IQueryable<DemandeConge> q = _context.DemandesConge
            .Include(d => d.Employe)
            .Include(d => d.ValidePar);

        q = role == "Manager"
            ? q.Where(d => d.Employe!.ManagerId == userId)
            : q.Where(d => d.EmployeId == userId);

        var list = await q.OrderByDescending(d => d.DateSoumission).ToListAsync();
        return Ok(list.Select(ToDto));
    }

    // GET /api/demandes-conge/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DemandeCongeDto>> GetById(int id)
    {
        var d = await _context.DemandesConge
            .Include(x => x.Employe)
            .Include(x => x.ValidePar)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = CurrentUserId();
        if (role == "Employe" && d.EmployeId != userId) return Forbid();
        if (role == "Manager" && d.Employe?.ManagerId != userId) return Forbid();

        return Ok(ToDto(d));
    }

    // POST /api/demandes-conge  (Employe)
    [HttpPost]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Create([FromBody] CreateDemandeCongeRequest req)
    {
        if (req.DateFin < req.DateDebut)
            return BadRequest(new { message = "La date de fin doit etre posterieure a la date de debut." });

        var d = new DemandeConge
        {
            EmployeId = CurrentUserId(),
            DateDebut = req.DateDebut,
            DateFin = req.DateFin,
            Type = req.Type,
            Statut = StatutConge.EnAttente,
            DateSoumission = DateTime.UtcNow
        };
        _context.DemandesConge.Add(d);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = d.Id }, new { id = d.Id });
    }

    // PUT /api/demandes-conge/{id}  (Employe, only if pending)
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDemandeCongeRequest req)
    {
        var userId = CurrentUserId();
        var d = await _context.DemandesConge.FindAsync(id);
        if (d is null) return NotFound();
        if (d.EmployeId != userId) return Forbid();
        if (d.Statut != StatutConge.EnAttente) return Forbid();
        if (req.DateFin < req.DateDebut)
            return BadRequest(new { message = "La date de fin doit etre posterieure a la date de debut." });

        d.DateDebut = req.DateDebut;
        d.DateFin = req.DateFin;
        d.Type = req.Type;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/demandes-conge/{id}  (Employe, only if pending)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = CurrentUserId();
        var d = await _context.DemandesConge.FindAsync(id);
        if (d is null) return NotFound();
        if (d.EmployeId != userId) return Forbid();
        if (d.Statut != StatutConge.EnAttente) return Forbid();
        _context.DemandesConge.Remove(d);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/demandes-conge/{id}/approuver  (Manager)
    [HttpPost("{id:int}/approuver")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Approuver(int id)
    {
        var managerId = CurrentUserId();
        var d = await _context.DemandesConge
            .Include(x => x.Employe)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return NotFound();
        if (d.Employe?.ManagerId != managerId) return Forbid();

        d.Statut = StatutConge.Approuve;
        d.ValideParId = managerId;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/demandes-conge/{id}/refuser  (Manager)
    [HttpPost("{id:int}/refuser")]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Refuser(int id, [FromBody] RefuserRequest req)
    {
        var managerId = CurrentUserId();
        var d = await _context.DemandesConge
            .Include(x => x.Employe)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return NotFound();
        if (d.Employe?.ManagerId != managerId) return Forbid();

        d.Statut = StatutConge.Refuse;
        d.ValideParId = managerId;
        d.MotifRefus = req.Motif;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static DemandeCongeDto ToDto(DemandeConge d) => new(
        d.Id, d.DateDebut, d.DateFin, d.Type, d.Statut, d.MotifRefus, d.DateSoumission,
        d.EmployeId, d.Employe is null ? "" : $"{d.Employe.Prenom} {d.Employe.Nom}",
        d.ValideParId, d.ValidePar is null ? null : $"{d.ValidePar.Prenom} {d.ValidePar.Nom}");
}
