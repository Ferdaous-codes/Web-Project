using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAppRH.Data;
using WebAppRH.Dtos;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DepartementsController : ControllerBase
{
    private readonly AppDbContext _context;
    public DepartementsController(AppDbContext context) => _context = context;

    // GET /api/departements
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartementDto>>> GetAll()
    {
        var deps = await _context.Departements
            .Include(d => d.Responsable)
            .Include(d => d.Employes)
            .ToListAsync();
        return Ok(deps.Select(ToDto));
    }

    // GET /api/departements/{id}
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DepartementDetailsDto>> GetById(int id)
    {
        var d = await _context.Departements
            .Include(x => x.Responsable)
            .Include(x => x.Employes).ThenInclude(e => e.Manager)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return NotFound();

        return Ok(new DepartementDetailsDto(
            d.Id, d.Nom, d.Budget,
            d.ResponsableId,
            d.Responsable is null ? null : $"{d.Responsable.Prenom} {d.Responsable.Nom}",
            d.Employes.Select(e => new EmployeDto(
                e.Id, e.Nom, e.Prenom, e.Email, e.Poste, e.SoldeConge,
                e.DepartementId, d.Nom,
                e.ManagerId, e.Manager is null ? null : $"{e.Manager.Prenom} {e.Manager.Nom}"))
                .ToList()));
    }

    // POST /api/departements (Admin)
    [HttpPost]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create([FromBody] CreateDepartementRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nom))
            return BadRequest(new { message = "Le nom du departement est obligatoire." });

        var d = new Departement
        {
            Nom = req.Nom,
            Budget = req.Budget,
            ResponsableId = req.ResponsableId
        };
        _context.Departements.Add(d);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = d.Id }, new { id = d.Id });
    }

    // PUT /api/departements/{id} (Admin)
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartementRequest req)
    {
        var d = await _context.Departements.FindAsync(id);
        if (d is null) return NotFound();
        d.Nom = req.Nom;
        d.Budget = req.Budget;
        d.ResponsableId = req.ResponsableId;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/departements/{id} (Admin)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Delete(int id)
    {
        var d = await _context.Departements
            .Include(x => x.Employes)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (d is null) return NotFound();

        if (d.Employes.Any())
            return BadRequest(new { message = "Impossible de supprimer un departement contenant des employes." });

        _context.Departements.Remove(d);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private static DepartementDto ToDto(Departement d) => new(
        d.Id, d.Nom, d.Budget,
        d.ResponsableId,
        d.Responsable is null ? null : $"{d.Responsable.Prenom} {d.Responsable.Nom}",
        d.Employes.Count);
}
