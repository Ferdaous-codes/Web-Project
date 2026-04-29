namespace WebAppRH.Models;

public class Departement
{
    public int Id { get; set; }
    public string Nom { get; set; } = string.Empty;
    public decimal Budget { get; set; } // decimal pour les montants financiers

    public int? ResponsableId { get; set; }
    public Manager? Responsable { get; set; }

    public ICollection<Employe> Employes { get; set; } = new List<Employe>();
}