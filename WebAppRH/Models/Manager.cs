namespace WebAppRH.Models;

public class Manager : Utilisateur
{
    // Pas de DepartementId : la FK est côté Departement.ResponsableId
    public Departement? Departement { get; set; }

    public ICollection<Employe> Equipe { get; set; } = new List<Employe>();
    public ICollection<DemandeConge> DemandesValidees { get; set; } = new List<DemandeConge>();
}