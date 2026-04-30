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
public class ManagersController : ControllerBase
{
    private readonly AppDbContext _context;
    public ManagersController(AppDbContext context) => _context = context;

    // GET /api/managers  — used both for admin list AND as dropdown source
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ManagerDto>>> GetAll()
    {
        var managers = await _context.Managers
            .Include(m => m.Departement)
            .Include(m => m.Equipe)
            .ToListAsync();

        return Ok(managers.Select(m => new ManagerDto(
            m.Id, m.Nom, m.Prenom, m.Email,
            m.Departement?.Id, m.Departement?.Nom,
            m.Equipe.Count)));
    }

    // GET /api/managers/{id}  (Admin)
    [HttpGet("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<ActionResult<ManagerDetailsDto>> GetById(int id)
    {
        var m = await _context.Managers
            .Include(x => x.Departement)
            .Include(x => x.Equipe).ThenInclude(e => e.Departement)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (m is null) return NotFound();

        return Ok(new ManagerDetailsDto(
            m.Id, m.Nom, m.Prenom, m.Email,
            m.Departement?.Id, m.Departement?.Nom,
            m.Equipe.Select(e => new EmployeDto(
                e.Id, e.Nom, e.Prenom, e.Email, e.Poste, e.SoldeConge,
                e.DepartementId, e.Departement?.Nom,
                e.ManagerId, $"{m.Prenom} {m.Nom}")).ToList()));
    }

    // PUT /api/managers/{id}  (Admin)
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateManagerRequest req)
    {
        var m = await _context.Managers
            .Include(x => x.Departement)
            .Include(x => x.Compte)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (m is null) return NotFound();

        if (req.Email != m.Email && await _context.Utilisateurs.AnyAsync(u => u.Email == req.Email && u.Id != id))
            return BadRequest(new { message = "Cet email est deja utilise." });

        m.Nom = req.Nom;
        m.Prenom = req.Prenom;
        m.Email = req.Email;

        // Detach previous department if changed
        if (m.Departement != null && m.Departement.Id != req.DepartementId)
            m.Departement.ResponsableId = null;

        if (req.DepartementId.HasValue)
        {
            var d = await _context.Departements.FindAsync(req.DepartementId.Value);
            if (d != null && (d.ResponsableId is null || d.ResponsableId == id))
                d.ResponsableId = m.Id;
        }

        if (m.Compte != null) m.Compte.Login = req.Email;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/managers/{id}  (Admin)
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Delete(int id)
    {
        var m = await _context.Managers
            .Include(x => x.Equipe)
            .Include(x => x.Departement)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (m is null) return NotFound();

        if (m.Equipe.Any())
            return BadRequest(new { message = "Impossible de supprimer un manager qui a des employes sous sa responsabilite." });

        if (m.Departement != null) m.Departement.ResponsableId = null;
        _context.Managers.Remove(m);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
