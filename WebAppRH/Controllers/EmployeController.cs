using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAppRH.Data;
using WebAppRH.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace WebAppRH.Controllers;

[Authorize]
public class EmployeController : Controller
{
    private readonly AppDbContext _context;

    public EmployeController(AppDbContext context)
    {
        _context = context;
    }

    // ============================================================
    // INDEX : liste tous les utilisateurs (Employes + Managers)
    // ============================================================
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Index()
    {
        var employes = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .ToListAsync();

        var managers = await _context.Managers
            .Include(m => m.Departement)
            .Include(m => m.Equipe)
            .ToListAsync();

        ViewBag.Managers = managers;
        return View(employes);
    }

    // ============================================================
    // DETAILS EMPLOYE
    // ============================================================
    public async Task<IActionResult> Details(int id)
    {
        var employe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .Include(e => e.DemandesConge)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employe == null) return NotFound();

        if (User.IsInRole("Employe"))
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            if (employe.Id != userId) return Forbid();
        }

        return View(employe);
    }

    // ============================================================
    // CREATE : Admin cree Employe OU Manager
    // ============================================================
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create()
    {
        ViewBag.Departements = await _context.Departements.ToListAsync();
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create(
        string typeUtilisateur,
        string nom,
        string prenom,
        string email,
        string motDePasse,
        string? poste,
        int? soldeConge,
        int? departementId,
        int? managerId)
    {
        if (string.IsNullOrWhiteSpace(motDePasse) || motDePasse.Length < 6)
        {
            ModelState.AddModelError("motDePasse", "Le mot de passe doit faire au moins 6 caracteres.");
        }

        var emailExiste = await _context.Utilisateurs.AnyAsync(u => u.Email == email);
        if (emailExiste)
        {
            ModelState.AddModelError("email", "Cet email est deja utilise.");
        }

        if (!new[] { "Manager", "Employe" }.Contains(typeUtilisateur))
        {
            ModelState.AddModelError("typeUtilisateur", "Type d'utilisateur invalide.");
        }

        if (ModelState.IsValid)
        {
            if (typeUtilisateur == "Manager")
            {
                var manager = new Manager
                {
                    Nom = nom,
                    Prenom = prenom,
                    Email = email,
                    MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(motDePasse),
                    Compte = new Compte
                    {
                        Login = email,
                        Role = "Manager",
                        Actif = true
                    }
                };

                _context.Utilisateurs.Add(manager);
                await _context.SaveChangesAsync();

                if (departementId.HasValue)
                {
                    var dep = await _context.Departements.FindAsync(departementId.Value);
                    if (dep != null && dep.ResponsableId == null)
                    {
                        dep.ResponsableId = manager.Id;
                        await _context.SaveChangesAsync();
                    }
                }

                TempData["Success"] = $"Manager {prenom} {nom} cree avec succes.";
            }
            else
            {
                var employe = new Employe
                {
                    Nom = nom,
                    Prenom = prenom,
                    Email = email,
                    MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(motDePasse),
                    Poste = poste ?? "",
                    SoldeConge = soldeConge ?? 25,
                    DepartementId = departementId,
                    ManagerId = managerId,
                    Compte = new Compte
                    {
                        Login = email,
                        Role = "Employe",
                        Actif = true
                    }
                };

                _context.Employes.Add(employe);
                await _context.SaveChangesAsync();

                TempData["Success"] = $"Employe {prenom} {nom} cree avec succes.";
            }

            return RedirectToAction(nameof(Index));
        }

        ViewBag.Departements = await _context.Departements.ToListAsync();
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View();
    }

    // ============================================================
    // EDIT EMPLOYE
    // ============================================================
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Edit(int id)
    {
        var employe = await _context.Employes.FindAsync(id);
        if (employe == null) return NotFound();
        ViewBag.Departements = await _context.Departements.ToListAsync();
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View(employe);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Edit(int id, Employe employe)
    {
        if (id != employe.Id) return BadRequest();

        if (ModelState.IsValid)
        {
            try
            {
                _context.Employes.Update(employe);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Employe modifie avec succes.";
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Employes.Any(e => e.Id == id))
                    return NotFound();
                throw;
            }
        }
        ViewBag.Departements = await _context.Departements.ToListAsync();
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View(employe);
    }

    // ============================================================
    // DELETE EMPLOYE
    // ============================================================
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Delete(int id)
    {
        var employe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.DemandesConge)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employe == null) return NotFound();
        return View(employe);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var employe = await _context.Employes
            .Include(e => e.DemandesConge)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employe == null) return NotFound();

        _context.Employes.Remove(employe);
        await _context.SaveChangesAsync();
        TempData["Success"] = "Employe supprime.";
        return RedirectToAction(nameof(Index));
    }

    // ============================================================
    // MON PROFIL (Employe connecte)
    // ============================================================
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> MonProfil()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var employe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .Include(e => e.DemandesConge)
            .FirstOrDefaultAsync(e => e.Id == userId);

        if (employe == null) return NotFound();
        return View(employe);
    }

    // ============================================================
    // MON EQUIPE (Manager connecte)
    // ============================================================
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> MonEquipe()
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var manager = await _context.Managers
            .Include(m => m.Departement)
            .FirstOrDefaultAsync(m => m.Id == managerId);

        if (manager == null) return NotFound();

        var equipe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.DemandesConge)
            .Where(e => e.ManagerId == managerId)
            .ToListAsync();

        ViewBag.Manager = manager;
        return View(equipe);
    }

    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> DetailsEquipe(int id)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var employe = await _context.Employes
            .Include(e => e.Departement)
            .Include(e => e.Manager)
            .Include(e => e.DemandesConge)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (employe == null) return NotFound();

        if (employe.ManagerId != managerId) return Forbid();

        return View(employe);
    }

    // ============================================================
    // GESTION DES MANAGERS (Admin)
    // ============================================================
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> DetailsManager(int id)
    {
        var manager = await _context.Managers
            .Include(m => m.Departement)
            .Include(m => m.Equipe)
                .ThenInclude(e => e.Departement)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (manager == null) return NotFound();
        return View(manager);
    }

    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> EditManager(int id)
    {
        var manager = await _context.Managers
            .Include(m => m.Departement)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (manager == null) return NotFound();

        ViewBag.Departements = await _context.Departements
            .Where(d => d.ResponsableId == null || d.ResponsableId == id)
            .ToListAsync();

        return View(manager);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> EditManager(int id, string nom, string prenom, string email, int? departementId)
    {
        var manager = await _context.Managers
            .Include(m => m.Departement)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (manager == null) return NotFound();

        manager.Nom = nom;
        manager.Prenom = prenom;
        manager.Email = email;

        if (manager.Departement != null && manager.Departement.Id != departementId)
        {
            manager.Departement.ResponsableId = null;
        }

        if (departementId.HasValue)
        {
            var dep = await _context.Departements.FindAsync(departementId.Value);
            if (dep != null && (dep.ResponsableId == null || dep.ResponsableId == id))
            {
                dep.ResponsableId = manager.Id;
            }
        }

        await _context.SaveChangesAsync();
        TempData["Success"] = "Manager modifie avec succes.";
        return RedirectToAction(nameof(Index));
    }

    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> DeleteManager(int id)
    {
        var manager = await _context.Managers
            .Include(m => m.Departement)
            .Include(m => m.Equipe)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (manager == null) return NotFound();
        return View(manager);
    }

    [HttpPost, ActionName("DeleteManager")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> DeleteManagerConfirmed(int id)
    {
        var manager = await _context.Managers
            .Include(m => m.Equipe)
            .Include(m => m.Departement)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (manager == null) return NotFound();

        if (manager.Equipe.Any())
        {
            TempData["Erreur"] = "Impossible de supprimer un manager qui a des employes sous sa responsabilite.";
            return RedirectToAction(nameof(Index));
        }

        if (manager.Departement != null)
        {
            manager.Departement.ResponsableId = null;
        }

        _context.Managers.Remove(manager);
        await _context.SaveChangesAsync();
        TempData["Success"] = "Manager supprime.";
        return RedirectToAction(nameof(Index));
    }
}