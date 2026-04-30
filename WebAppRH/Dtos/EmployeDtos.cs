namespace WebAppRH.Dtos;

// ===== EMPLOYE =====
public record EmployeDto(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    string Poste,
    int SoldeConge,
    int? DepartementId,
    string? DepartementNom,
    int? ManagerId,
    string? ManagerNomComplet);

public record EmployeDetailsDto(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    string Poste,
    int SoldeConge,
    int? DepartementId,
    string? DepartementNom,
    int? ManagerId,
    string? ManagerNomComplet,
    int NbDemandesConge);

public record CreateEmployeRequest(
    string TypeUtilisateur,        // "Employe" | "Manager"
    string Nom,
    string Prenom,
    string Email,
    string MotDePasse,
    string? Poste,
    int? SoldeConge,
    int? DepartementId,
    int? ManagerId);

public record UpdateEmployeRequest(
    string Nom,
    string Prenom,
    string Email,
    string Poste,
    int SoldeConge,
    int? DepartementId,
    int? ManagerId);

// ===== MANAGER =====
public record ManagerDto(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    int? DepartementId,
    string? DepartementNom,
    int TailleEquipe);

public record ManagerDetailsDto(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    int? DepartementId,
    string? DepartementNom,
    List<EmployeDto> Equipe);

public record UpdateManagerRequest(
    string Nom,
    string Prenom,
    string Email,
    int? DepartementId);
