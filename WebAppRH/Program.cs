using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using WebAppRH.Data;
using WebAppRH.Models;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. Services
// ============================================================

// MVC + Razor
builder.Services.AddControllersWithViews();

// Base de donnees (SQL Server)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentification par cookies
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Account/Login";
        options.LogoutPath = "/Account/Logout";
        options.AccessDeniedPath = "/Account/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    });

builder.Services.AddAuthorization();

// Anti-forgery (protection CSRF)
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

var app = builder.Build();

// ============================================================
// 2. Pipeline HTTP
// ============================================================

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// ⚠️ Ordre important : Authentication AVANT Authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// ============================================================
// 3. Migration automatique au demarrage (developpement)
// ============================================================
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // applique les migrations automatiquement
                           // Creer un admin par defaut s'il n'existe pas
    if (!db.Administrateurs.Any())
    {
        var admin = new Administrateur
        {
            Nom = "Admin",
            Prenom = "Super",
            Email = "admin@webapprh.tn",
            MotDePasseHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            Compte = new Compte
            {
                Login = "admin@webapprh.tn",
                Role = "Administrateur",
                Actif = true
            }
        };
        db.Administrateurs.Add(admin);
        db.SaveChanges();
    }
}

app.Run();