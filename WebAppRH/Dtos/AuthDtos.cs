namespace WebAppRH.Dtos;

public record LoginRequest(string Email, string MotDePasse);

public record LoginResponse(
    string Token,
    DateTime ExpiresAt,
    int UserId,
    string Nom,
    string Prenom,
    string Email,
    string Role);

public record MeResponse(
    int Id,
    string Nom,
    string Prenom,
    string Email,
    string Role);
