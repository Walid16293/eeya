using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LeLaboratoire.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        return Ok(new
        {
            status = "HEALTHY",
            app = "Le Laboratoire E-commerce API",
            timestamp = DateTime.UtcNow,
            message = "Système en ligne et opérationnel 24/7."
        });
    }
}
