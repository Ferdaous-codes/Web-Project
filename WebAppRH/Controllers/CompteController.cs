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
public class CompteController : ControllerBase
{
    private readonly AppDbContext _context;
    public CompteController(AppDbContext context) => _context = context;

    // GET /api/compte  — current user info
    [HttpGet]
    public async Task<ActionResult<CompteDto>> GetMine()
    {
        var userId = CurrentUserId();
        var u = await _context.Utilisateurs
            .Include(x => x.Compte)
            .FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null) return NotFound();

        var role = u.Compte?.Role ?? "Inconnu";
        var type = u switch
        {
            Administrateur => "Administrateur",
            Manager => "Manager",
            Employe => "Employe",
            _ => "Inconnu"
        };
        return Ok(new CompteDto(u.Id, u.Nom, u.Prenom, u.Email, role, u.Compte?.Actif ?? true, type));
    }

    // PUT /api/compte/profil
    [HttpPut("profil")]
    public async Task<IActionResult> UpdateProfil([FromBody] UpdateProfilRequest req)
    {
        var userId = CurrentUserId();
        var u = await _context.Utilisateurs
            .Include(x => x.Compte)
            .FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Nom)
            || string.IsNullOrWhiteSpace(req.Prenom)
            || string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Tous les champs sont obligatoires." });

        if (req.Email != u.Email
            && await _context.Utilisateurs.AnyAsync(x => x.Email == req.Email && x.Id != userId))
            return BadRequest(new { message = "Cet email est deja utilise par un autre compte." });

        u.Nom = req.Nom;
        u.Prenom = req.Prenom;
        u.Email = req.Email;
        if (u.Compte != null) u.Compte.Login = req.Email;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/compte/password
    [HttpPut("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = CurrentUserId();
        var u = await _context.Utilisateurs.FirstOrDefaultAsync(x => x.Id == userId);
        if (u is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.MotDePasseActuel)
            || string.IsNullOrWhiteSpace(req.NouveauMotDePasse)
            || string.IsNullOrWhiteSpace(req.Confirmation))
            return BadRequest(new { message = "Tous les champs sont obligatoires." });

        if (!BCrypt.Net.BCrypt.Verify(req.MotDePasseActuel, u.MotDePasseHash))
            return BadRequest(new { message = "Le mot de passe actuel est incorrect." });

        if (req.NouveauMotDePasse.Length < 6)
            return BadRequest(new { message = "Le nouveau mot de passe doit faire au moins 6 caracteres." });

        if (req.NouveauMotDePasse != req.Confirmation)
            return BadRequest(new { message = "Les deux mots de passe ne correspondent pas." });

        if (req.NouveauMotDePasse == req.MotDePasseActuel)
            return BadRequest(new { message = "Le nouveau mot de passe doit etre different de l'actuel." });

        u.MotDePasseHash = BCrypt.Net.BCrypt.HashPassword(req.NouveauMotDePasse);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    private int CurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
