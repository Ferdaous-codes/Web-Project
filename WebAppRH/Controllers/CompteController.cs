using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

[Authorize]
public class CompteController : Controller
{
    private readonly AppDbContext _context;

    public CompteController(AppDbContext context)
    {
        _context = context;
    }

    // ============================================================
    // MON COMPTE : page principale
    // ============================================================
    public async Task<IActionResult> Index()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var utilisateur = await _context.Utilisateurs
            .Include(u => u.Compte)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (utilisateur == null) return NotFound();

        return View(utilisateur);
    }

    // ============================================================
    // MODIFIER PROFIL : nom, prenom, email
    // ============================================================
    public async Task<IActionResult> ModifierProfil()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var utilisateur = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (utilisateur == null) return NotFound();

        return View(utilisateur);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ModifierProfil(string nom, string prenom, string email)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var utilisateur = await _context.Utilisateurs
            .Include(u => u.Compte)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (utilisateur == null) return NotFound();

        if (string.IsNullOrWhiteSpace(nom) || string.IsNullOrWhiteSpace(prenom) || string.IsNullOrWhiteSpace(email))
        {
            ViewBag.Erreur = "Tous les champs sont obligatoires.";
            return View(utilisateur);
        }

        // Verifier que le nouvel email n'est pas deja utilise par un autre
        if (email != utilisateur.Email)
        {
            var emailExiste = await _context.Utilisateurs
                .AnyAsync(u => u.Email == email && u.Id != userId);

            if (emailExiste)
            {
                ViewBag.Erreur = "Cet email est deja utilise par un autre compte.";
                return View(utilisateur);
            }
        }

        utilisateur.Nom = nom;
        utilisateur.Prenom = prenom;
        utilisateur.Email = email;

        // Mettre a jour le login du compte si l'email change
        if (utilisateur.Compte != null)
        {
            utilisateur.Compte.Login = email;
        }

        await _context.SaveChangesAsync();

        TempData["Success"] = "Profil mis a jour avec succes. Reconnectez-vous pour voir les changements.";
        return RedirectToAction(nameof(Index));
    }

    // ============================================================
    // CHANGER MOT DE PASSE
    // ============================================================
    public IActionResult ChangerMotDePasse() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ChangerMotDePasse(
        string motDePasseActuel,
        string nouveauMotDePasse,
        string confirmation)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var utilisateur = await _context.Utilisateurs
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (utilisateur == null) return NotFound();

        if (string.IsNullOrWhiteSpace(motDePasseActuel) ||
            string.IsNullOrWhiteSpace(nouveauMotDePasse) ||
            string.IsNullOrWhiteSpace(confirmation))
        {
            ViewBag.Erreur = "Tous les champs sont obligatoires.";
            return View();
        }

        if (!BCrypt.Net.BCrypt.Verify(motDePasseActuel, utilisateur.MotDePasseHash))
        {
            ViewBag.Erreur = "Le mot de passe actuel est incorrect.";
            return View();
        }

        if (nouveauMotDePasse.Length < 6)
        {
            ViewBag.Erreur = "Le nouveau mot de passe doit faire au moins 6 caracteres.";
            return View();
        }

        if (nouveauMotDePasse != confirmation)
        {
            ViewBag.Erreur = "Les deux mots de passe ne correspondent pas.";
            return View();
        }

        if (nouveauMotDePasse == motDePasseActuel)
        {
            ViewBag.Erreur = "Le nouveau mot de passe doit etre different de l'actuel.";
            return View();
        }

        utilisateur.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(nouveauMotDePasse);
        await _context.SaveChangesAsync();

        TempData["Success"] = "Mot de passe modifie avec succes.";
        return RedirectToAction(nameof(Index));
    }
}