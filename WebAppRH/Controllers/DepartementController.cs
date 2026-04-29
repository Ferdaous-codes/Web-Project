using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebAppRH.Data;
using WebAppRH.Models;
using Microsoft.AspNetCore.Authorization;

namespace WebAppRH.Controllers;

[Authorize]
public class DepartementController : Controller
{
    private readonly AppDbContext _context;

    public DepartementController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var departements = await _context.Departements
            .Include(d => d.Responsable)
            .Include(d => d.Employes)
            .ToListAsync();
        return View(departements);
    }

    public async Task<IActionResult> Details(int id)
    {
        var dep = await _context.Departements
            .Include(d => d.Responsable)
            .Include(d => d.Employes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dep == null) return NotFound();
        return View(dep);
    }

    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create()
    {
        // ✅ Seuls les managers SANS département sont sélectionnables
        ViewBag.Managers = await _context.Managers
            .Where(m => m.Departement == null)
            .ToListAsync();
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Create(Departement departement)
    {
        if (ModelState.IsValid)
        {
            _context.Departements.Add(departement);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Département créé avec succès.";
            return RedirectToAction(nameof(Index));
        }
        ViewBag.Managers = await _context.Managers
            .Where(m => m.Departement == null)
            .ToListAsync();
        return View(departement);
    }

    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Edit(int id)
    {
        var dep = await _context.Departements.FindAsync(id);
        if (dep == null) return NotFound();
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View(dep);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Edit(int id, Departement departement)
    {
        if (id != departement.Id) return BadRequest();

        if (ModelState.IsValid)
        {
            try
            {
                _context.Departements.Update(departement);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Département modifié avec succès.";
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Departements.Any(d => d.Id == id))
                    return NotFound();
                throw;
            }
        }
        ViewBag.Managers = await _context.Managers.ToListAsync();
        return View(departement);
    }

    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> Delete(int id)
    {
        var dep = await _context.Departements
            .Include(d => d.Responsable)
            .Include(d => d.Employes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dep == null) return NotFound();
        return View(dep);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Administrateur")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var dep = await _context.Departements
            .Include(d => d.Employes)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (dep == null) return NotFound();

        if (dep.Employes != null && dep.Employes.Any())
        {
            TempData["Erreur"] = "Impossible de supprimer un département contenant des employés.";
            return RedirectToAction(nameof(Index));
        }

        _context.Departements.Remove(dep);
        await _context.SaveChangesAsync();
        TempData["Success"] = "Département supprimé avec succès.";
        return RedirectToAction(nameof(Index));
    }
}