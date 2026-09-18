using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Services;

namespace LeLaboratoire.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext context, IJwtTokenService jwtTokenService, ILogger<AuthController> logger)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Username.ToLower() == request.Username.Trim().ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Échec de connexion pour le compte : {Username}", request.Username);
            return Unauthorized(new { message = "Identifiants invalides. Accès strictement réservé aux 2 administrateurs." });
        }

        var token = _jwtTokenService.GenerateToken(user);
        var userDto = new UserDto(user.Id, user.Username, user.FullName, user.Role);

        return Ok(new LoginResponse(
            Token: token,
            User: userDto,
            ExpiresAt: DateTime.UtcNow.AddDays(14)
        ));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            return NotFound();

        return Ok(new UserDto(user.Id, user.Username, user.FullName, user.Role));
    }
}
