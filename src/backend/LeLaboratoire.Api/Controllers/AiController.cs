using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Services;

namespace LeLaboratoire.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMarketAiService _marketAiService;
    private readonly ILogger<AiController> _logger;

    public AiController(AppDbContext context, IMarketAiService marketAiService, ILogger<AiController> logger)
    {
        _context = context;
        _marketAiService = marketAiService;
        _logger = logger;
    }

    [HttpPost("market-research")]
    public async Task<ActionResult<MarketResearchResponse>> AnalyzeMarketPrice([FromBody] MarketResearchRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) return NotFound(new { message = "Marchandise introuvable." });

        _logger.LogInformation("Lancement de l'analyse IA de marché pour le produit : {Name}", product.Name);

        var result = await _marketAiService.AnalyzeMarketPriceAsync(product.Id, product.Name, request.CustomSearchQuery);

        return Ok(result);
    }
}
