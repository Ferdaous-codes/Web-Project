using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using WebAppRH.Data;
using WebAppRH.Dtos;
using WebAppRH.Models;
using WebAppRH.Services;

namespace WebAppRH.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly JwtService _jwt;

    public AuthController(AppDbContext context, JwtService jwt)
    {
        _context = context;
        _jwt = jwt;
    }

    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.MotDePasse))
            return BadRequest(new { message = "Email et mot de passe requis." });

        var user = await _context.Utilisateurs
            .Include(u => u.Compte)
            .FirstOrDefaultAsync(u => u.Email == req.Email);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.MotDePasse, user.MotDePasseHash))
            return Unauthorized(new { message = "Email ou mot de passe incorrect." });

        if (user.Compte is { Actif: false })
            return Unauthorized(new { message = "Votre compte a ete desactive. Contactez l'administrateur." });

        var role = user.Compte?.Role ?? RoleFromType(user);
        var (token, expires) = _jwt.GenerateToken(user, role);

        return Ok(new LoginResponse(
            token, expires, user.Id, user.Nom, user.Prenom, user.Email, role));
    }

    // GET /api/auth/me  — used by Angular to refresh user info on app start
    [HttpGet("me")]
    [Authorize]
    public ActionResult<MeResponse> Me()
    {
        var id = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var nom = User.FindFirstValue(ClaimTypes.Name) ?? "";
        var email = User.FindFirstValue(ClaimTypes.Email) ?? "";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "";
        var prenom = User.FindFirstValue("Prenom") ?? "";
        return Ok(new MeResponse(id, nom, prenom, email, role));
    }

    private static string RoleFromType(Utilisateur u) => u switch
    {
        Administrateur => "Administrateur",
        Manager => "Manager",
        Employe => "Employe",
        _ => "Inconnu"
    };
}
