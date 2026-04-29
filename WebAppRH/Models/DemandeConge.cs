namespace WebAppRH.Models;

public enum TypeConge
{
    Annuel,
    Maladie,
    SansSolde
}

public enum StatutConge
{
    EnAttente,
    Approuve,
    Refuse
}

public class DemandeConge
{
    public int Id { get; set; }
    public DateTime DateDebut { get; set; }
    public DateTime DateFin { get; set; }

    public TypeConge Type { get; set; } = TypeConge.Annuel;
    public StatutConge Statut { get; set; } = StatutConge.EnAttente;

    public string? MotifRefus { get; set; }

    public int EmployeId { get; set; }
    public Employe? Employe { get; set; }

    public int? ValideParId { get; set; }
    public Manager? ValidePar { get; set; }

    public DateTime DateSoumission { get; set; } = DateTime.UtcNow;
}