using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[Authorize(Roles = "Manager,Employe")]
public class DemandeCongeController : Controller
{
    private readonly AppDbContext _context;

    public DemandeCongeController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        List<DemandeConge> demandes;

        if (role == "Manager")
        {
            demandes = await _context.DemandesConge
                .Include(d => d.Employe)
                .Where(d => d.Employe!.ManagerId == userId)
                .ToListAsync();
        }
        else
        {
            demandes = await _context.DemandesConge
                .Include(d => d.Employe)
                .Where(d => d.EmployeId == userId)
                .ToListAsync();
        }

        return View(demandes);
    }

    [Authorize(Roles = "Employe")]
    public IActionResult Create()
    {
        return View();
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Create(DemandeConge demande)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        demande.EmployeId = userId;
        demande.DateSoumission = DateTime.UtcNow;
        demande.Statut = StatutConge.EnAttente; // ✅ enum

        if (ModelState.IsValid)
        {
            _context.DemandesConge.Add(demande);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Demande soumise avec succès.";
            return RedirectToAction(nameof(Index));
        }

        return View(demande);
    }

    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Edit(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var demande = await _context.DemandesConge.FindAsync(id);

        if (demande == null) return NotFound();
        if (demande.EmployeId != userId) return Forbid();
        if (demande.Statut != StatutConge.EnAttente) return Forbid(); // ✅ enum

        return View(demande);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Edit(int id, DemandeConge demande)
    {
        if (id != demande.Id) return BadRequest();

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var demandeExistante = await _context.DemandesConge
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Id == id);

        if (demandeExistante == null) return NotFound();
        if (demandeExistante.EmployeId != userId) return Forbid();
        if (demandeExistante.Statut != StatutConge.EnAttente) return Forbid(); // ✅ enum

        if (ModelState.IsValid)
        {
            demande.EmployeId = userId;
            demande.Statut = StatutConge.EnAttente; // ✅ enum
            demande.DateSoumission = demandeExistante.DateSoumission;
            _context.DemandesConge.Update(demande);
            await _context.SaveChangesAsync();
            TempData["Success"] = "Demande modifiée avec succès.";
            return RedirectToAction(nameof(Index));
        }

        return View(demande);
    }

    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var demande = await _context.DemandesConge
            .Include(d => d.Employe)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (demande == null) return NotFound();
        if (demande.EmployeId != userId) return Forbid();
        if (demande.Statut != StatutConge.EnAttente) return Forbid(); // ✅ enum

        return View(demande);
    }

    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Employe")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var demande = await _context.DemandesConge.FindAsync(id);

        if (demande == null) return NotFound();
        if (demande.EmployeId != userId) return Forbid();
        if (demande.Statut != StatutConge.EnAttente) return Forbid(); // ✅ enum

        _context.DemandesConge.Remove(demande);
        await _context.SaveChangesAsync();
        TempData["Success"] = "Demande supprimée.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Approuver(int id)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var demande = await _context.DemandesConge.FindAsync(id);
        if (demande == null) return NotFound();

        demande.Statut = StatutConge.Approuve; // ✅ enum
        demande.ValideParId = managerId;       // ✅ trace de qui a validé
        await _context.SaveChangesAsync();
        TempData["Success"] = "Demande approuvée.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Roles = "Manager")]
    public async Task<IActionResult> Refuser(int id, string? motif)
    {
        var managerId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var demande = await _context.DemandesConge.FindAsync(id);
        if (demande == null) return NotFound();

        demande.Statut = StatutConge.Refuse;   // ✅ enum
        demande.ValideParId = managerId;
        demande.MotifRefus = motif;            // ✅ stocker le motif
        await _context.SaveChangesAsync();
        TempData["Success"] = "Demande refusée.";
        return RedirectToAction(nameof(Index));
    }
}