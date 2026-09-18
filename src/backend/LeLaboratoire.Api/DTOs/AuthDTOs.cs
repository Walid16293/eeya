using System.ComponentModel.DataAnnotations;

namespace LeLaboratoire.Api.DTOs;

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record LoginResponse(
    string Token,
    UserDto User,
    DateTime ExpiresAt
);

public record UserDto(
    Guid Id,
    string Username,
    string FullName,
    string Role
);
