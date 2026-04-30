using WebAppRH.Models;

namespace WebAppRH.Dtos;

public record DemandeCongeDto(
    int Id,
    DateTime DateDebut,
    DateTime DateFin,
    TypeConge Type,
    StatutConge Statut,
    string? MotifRefus,
    DateTime DateSoumission,
    int EmployeId,
    string EmployeNomComplet,
    int? ValideParId,
    string? ValideParNomComplet);

public record CreateDemandeCongeRequest(
    DateTime DateDebut,
    DateTime DateFin,
    TypeConge Type);

public record UpdateDemandeCongeRequest(
    DateTime DateDebut,
    DateTime DateFin,
    TypeConge Type);

public record RefuserRequest(string? Motif);
