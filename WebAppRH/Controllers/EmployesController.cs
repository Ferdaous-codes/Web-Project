using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Dtos;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class EmployesController : ControllerBase
{
    private readonly AppDbContext _context;
    public EmployesController(AppDbContext context) => _context = context;

    // ============================================================
    // GET /api/employes  — liste tous les employes (Admin)
    // ============================================================
    [HttpGet]
    [Authorize(Roles = "Administrateur")]
    public async Task<ActionResult<IEnumerable<EmployeDto>>> GetAll()
    {
        var employes = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .ToListAsync();

        return Ok(employes.Select(ToDto));
    }

    // ============================================================
    // GET /api/employes/mon-profil  (Employe)
    // NOTE: must come BEFORE the {id:int} route
    // ============================================================
    [HttpGet("mon-profil")]
    [Authorize(Roles = "Employe")]
    public async Task<ActionResult<EmployeDetailsDto>> MonProfil()
    {
        var userId = CurrentUserId();
        var e = await _context.Employes
            .Include(x => x.Departement)
            .Include(x => x.Manager)
            .Include(x => x.DemandesConge)
            .FirstOrDefaultAsync(x => x.Id == userId);
        return e is null ? NotFound() : Ok(ToDetails(e));
    }

    // ============================================================
    // GET /api/employes/mon-equipe  (Manager)
    // ============================================================
    [HttpGet("mon-equipe")]
    [Authorize(Roles = "Manager")]
    public async Task<ActionResult<IEnumerable<EmployeDto>>> MonEquipe()
    {
        var managerId = CurrentUserId();
        var equipe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .Where(e => e.ManagerId == managerId)
            .ToListAsync();
        return Ok(equipe.Select(ToDto));
    }

    // ============================================================
    // GET /api/employes/{id}  — Admin / Manager (own team) / Employe (self)
    // ============================================================
    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeDetailsDto>> GetById(int id)
    {
        var e = await _context.Employes
            .Include(x => x.Departement)
            .Include(x => x.Manager)
            .Include(x => x.DemandesConge)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (e is null) return NotFound();

        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = CurrentUserId();
        if (role == "Employe" && e.Id != userId) return Forbid();
        if (role == "Manager" && e.ManagerId != userId) return Forbid();

        return Ok(ToDetails(e));
    }

    // ============================================================
    // POST /api/employes  — cree Employe OU Manager (Admin)
    // ============================================================
    [HttpPost]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create([FromBody] CreateEmployeRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.MotDePasse) || req.MotDePasse.Length < 6)
            return BadRequest(new { message = "Le mot de passe doit faire au moins 6 caracteres." });

        if (await _context.Utilisateurs.AnyAsync(u => u.Email == req.Email))
            return BadRequest(new { message = "Cet email est deja utilise." });

        if (req.TypeUtilisateur != "Employe" && req.TypeUtilisateur != "Manager")
            return BadRequest(new { message = "Type d'utilisateur invalide." });

        if (req.TypeUtilisateur == "Manager")
        {
            var m = new Manager
            {
                Nom = req.Nom,
                Prenom = req.Prenom,
                Email = req.Email,
                MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(req.MotDePasse),
                Compte = new Compte { Login = req.Email, Role = "Manager", Actif = true }
            };
            _context.Utilisateurs.Add(m);
            await _context.SaveChangesAsync();

            if (req.DepartementId.HasValue)
            {
                var d = await _context.Departements.FindAsync(req.DepartementId.Value);
                if (d is { ResponsableId: null })
                {
                    d.ResponsableId = m.Id;
                    await _context.SaveChangesAsync();
                }
            }
            return CreatedAtAction(nameof(GetById), new { id = m.Id }, new { id = m.Id, type = "Manager" });
        }
        else
        {
            var e = new Employe
            {
                Nom = req.Nom,
                Prenom = req.Prenom,
                Email = req.Email,
                MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(req.MotDePasse),
                Poste = req.Poste ?? "",
                SoldeConge = req.SoldeConge ?? 25,
                DepartementId = req.DepartementId,
                ManagerId = req.ManagerId,
                Compte = new Compte { Login = req.Email, Role = "Employe", Actif = true }
            };
            _context.Employes.Add(e);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = e.Id }, new { id = e.Id, type = "Employe" });
        }
    }

    // ============================================================
    // PUT /api/employes/{id}  (Admin)
    // ============================================================
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEmployeRequest req)
    {
        var e = await _context.Employes
            .Include(x => x.Compte)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return NotFound();

        if (req.Email != e.Email && await _context.Utilisateurs.AnyAsync(u => u.Email == req.Email && u.Id != id))
            return BadRequest(new { message = "Cet email est deja utilise." });

        e.Nom = req.Nom;
        e.Prenom = req.Prenom;
        e.Email = req.Email;
        e.Poste = req.Poste;
        e.SoldeConge = req.SoldeConge;
        e.DepartementId = req.DepartementId;
        e.ManagerId = req.ManagerId;
        if (e.Compte != null) e.Compte.Login = req.Email;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ============================================================
    // DELETE /api/employes/{id}  (Admin)
    // ============================================================
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Delete(int id)
    {
        var e = await _context.Employes
            .Include(x => x.DemandesConge)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (e is null) return NotFound();
        _context.Employes.Remove(e);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ============================================================
    // Helpers
    // ============================================================
    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static EmployeDto ToDto(Employe e) => new(
        e.Id, e.Nom, e.Prenom, e.Email, e.Poste, e.SoldeConge,
        e.DepartementId, e.Departement?.Nom,
        e.ManagerId, e.Manager is null ? null : $"{e.Manager.Prenom} {e.Manager.Nom}");

    private static EmployeDetailsDto ToDetails(Employe e) => new(
        e.Id, e.Nom, e.Prenom, e.Email, e.Poste, e.SoldeConge,
        e.DepartementId, e.Departement?.Nom,
        e.ManagerId, e.Manager is null ? null : $"{e.Manager.Prenom} {e.Manager.Nom}",
        e.DemandesConge.Count);
}
