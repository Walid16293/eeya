using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
