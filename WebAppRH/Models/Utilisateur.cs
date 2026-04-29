namespace WebAppRH.Models;

public abstract class Utilisateur
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public string Prenom { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string MotDePasseHash { get; set; } = string.Empty;

    // Le rôle est géré via Compte.Role (pour l'authentification)
    // et via le type concret de la classe (Employe/Manager/Administrateur)

    public Compte? Compte { get; set; }
}