namespace WebAppRH.Dtos;

public record DepartementDto(
    int Id,
    string Nom,
    decimal Budget,
    int? ResponsableId,
    string? ResponsableNomComplet,
    int NbEmployes);

public record DepartementDetailsDto(
    int Id,
    string Nom,
    decimal Budget,
    int? ResponsableId,
    string? ResponsableNomComplet,
    List<EmployeDto> Employes);

public record CreateDepartementRequest(
    string Nom,
    decimal Budget,
    int? ResponsableId);

public record UpdateDepartementRequest(
    string Nom,
    decimal Budget,
    int? ResponsableId);
