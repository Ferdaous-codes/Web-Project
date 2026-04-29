using System.ComponentModel.DataAnnotations;

namespace WebAppRH.Models;

public class Compte
{
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Login { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    public string Role { get; set; } = string.Empty; // "Admin" | "Manager" | "Employe"

    public bool Actif { get; set; } = true;

    public int UtilisateurId { get; set; }
    public Utilisateur? Utilisateur { get; set; }
}