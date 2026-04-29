using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Models;

namespace WebAppRH.Controllers;

public class AccountController : Controller
{
    private readonly AppDbContext _context;

    public AccountController(AppDbContext context)
    {
        _context = context;
    }

    public IActionResult Login() => View();

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(string email, string motDePasse)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(motDePasse))
        {
            ViewBag.Erreur = "Veuillez remplir tous les champs.";
            return View();
        }

        var utilisateur = await _context.Utilisateurs
            .Include(u => u.Compte)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (utilisateur == null || !BCrypt.Net.BCrypt.Verify(motDePasse, utilisateur.MotDePasseHash))
        {
            ViewBag.Erreur = "Email ou mot de passe incorrect.";
            return View();
        }

        if (utilisateur.Compte != null && !utilisateur.Compte.Actif)
        {
            ViewBag.Erreur = "Votre compte a ete desactive. Contactez l'administrateur.";
            return View();
        }

        var role = utilisateur.Compte?.Role ?? GetRoleFromType(utilisateur);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, utilisateur.Id.ToString()),
            new Claim(ClaimTypes.Name, utilisateur.Nom),
            new Claim(ClaimTypes.Email, utilisateur.Email),
            new Claim(ClaimTypes.Role, role),
            new Claim("Prenom", utilisateur.Prenom ?? "")
        };

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        var principal = new ClaimsPrincipal(identity);

        await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, principal);

        return role switch
        {
            "Administrateur" => RedirectToAction("Index", "Employe"),
            "Manager" => RedirectToAction("Index", "DemandeConge"),
            "Employe" => RedirectToAction("Index", "DemandeConge"),
            _ => RedirectToAction("Index", "Home")
        };
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction("Login");
    }

    public IActionResult AccessDenied() => View();

    private static string GetRoleFromType(Utilisateur u)
    {
        if (u is Administrateur) return "Administrateur";
        if (u is Manager) return "Manager";
        if (u is Employe) return "Employe";
        return "Inconnu";
    }
}