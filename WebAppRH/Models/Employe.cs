namespace WebAppRH.Models;

public class Employe : Utilisateur
{
    public string Poste { get; set; } = string.Empty;
    public int SoldeConge { get; set; } = 25; // 25 jours = standard tunisien

    public int? DepartementId { get; set; }
    public Departement? Departement { get; set; }

    public int? ManagerId { get; set; }
    public Manager? Manager { get; set; }

    public ICollection<DemandeConge> DemandesConge { get; set; } = new List<DemandeConge>();
}