namespace WebAppRH.Dtos;

public record CompteDto(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    string Role,
    bool Actif,
    string TypeUtilisateur);

public record UpdateProfilRequest(
    string Nom,
    string Prenom,
    string Email);

public record ChangePasswordRequest(
    string MotDePasseActuel,
    string NouveauMotDePasse,
    string Confirmation);
