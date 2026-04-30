using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    public DashboardController(AppDbContext context) => _context = context;

    // GET /api/dashboard/stats — returns role-specific stats for the dashboard
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        if (role == "Administrateur")
        {
            var totalEmployes = await _context.Employes.CountAsync();
            var totalManagers = await _context.Managers.CountAsync();
            var totalDepartements = await _context.Departements.CountAsync();
            var demandesEnAttente = await _context.DemandesConge
                .CountAsync(d => d.Statut == StatutConge.EnAttente);

            var employesParDepartement = await _context.Departements
                .Select(d => new { departement = d.Nom, count = d.Employes.Count })
                .ToListAsync();

            return Ok(new
            {
                role,
                totalEmployes,
                totalManagers,
                totalDepartements,
                demandesEnAttente,
                employesParDepartement
            });
        }

        if (role == "Manager")
        {
            var tailleEquipe = await _context.Employes
                .CountAsync(e => e.ManagerId == userId);
            var demandesEnAttente = await _context.DemandesConge
                .CountAsync(d => d.Employe!.ManagerId == userId && d.Statut == StatutConge.EnAttente);
            var demandesApprouvees = await _context.DemandesConge
                .CountAsync(d => d.Employe!.ManagerId == userId && d.Statut == StatutConge.Approuve);
            var demandesRefusees = await _context.DemandesConge
                .CountAsync(d => d.Employe!.ManagerId == userId && d.Statut == StatutConge.Refuse);

            return Ok(new
            {
                role,
                tailleEquipe,
                demandesEnAttente,
                demandesApprouvees,
                demandesRefusees
            });
        }

        // Employe
        var employe = await _context.Employes.FindAsync(userId);
        var mesDemandesEnAttente = await _context.DemandesConge
            .CountAsync(d => d.EmployeId == userId && d.Statut == StatutConge.EnAttente);
        var mesDemandesApprouvees = await _context.DemandesConge
            .CountAsync(d => d.EmployeId == userId && d.Statut == StatutConge.Approuve);
        var mesDemandesRefusees = await _context.DemandesConge
            .CountAsync(d => d.EmployeId == userId && d.Statut == StatutConge.Refuse);

        return Ok(new
        {
            role,
            soldeConge = employe?.SoldeConge ?? 0,
            mesDemandesEnAttente,
            mesDemandesApprouvees,
            mesDemandesRefusees
        });
    }
}
