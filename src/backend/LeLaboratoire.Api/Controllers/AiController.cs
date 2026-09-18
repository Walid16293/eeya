using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Services;

namespace LeLaboratoire.Api.Controllers;

public class DetectColorRequest
{
    public string ImageUrl { get; set; } = string.Empty;
}

public class DetectColorsBatchRequest
{
    public List<string> ImageUrls { get; set; } = new();
}

[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IMarketAiService _marketAiService;
    private readonly IColorDetectionService _colorDetectionService;
    private readonly ILogger<AiController> _logger;

    public AiController(
        AppDbContext context,
        IMarketAiService marketAiService,
        IColorDetectionService colorDetectionService,
        ILogger<AiController> logger)
    {
        _context = context;
        _marketAiService = marketAiService;
        _colorDetectionService = colorDetectionService;
        _logger = logger;
    }

    [HttpPost("market-research")]
    [Authorize]
    public async Task<ActionResult<MarketResearchResponse>> AnalyzeMarketPrice([FromBody] MarketResearchRequest request)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) return NotFound(new { message = "Marchandise introuvable." });

        _logger.LogInformation("Lancement de l'analyse IA de marché pour le produit : {Name}", product.Name);

        var result = await _marketAiService.AnalyzeMarketPriceAsync(product.Id, product.Name, request.CustomSearchQuery);

        return Ok(result);
    }

    /// <summary>
    /// Détection chromatique IA côté serveur à partir d'une URL d'image
    /// </summary>
    [HttpPost("detect-color")]
    [AllowAnonymous]
    public async Task<ActionResult<ColorDetectionResult>> DetectColor([FromBody] DetectColorRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            return BadRequest(new { message = "L'URL de l'image est requise." });
        }

        _logger.LogInformation("Détection de couleur sur le serveur pour l'image : {Url}", request.ImageUrl);
        var result = await _colorDetectionService.DetectColorFromUrlAsync(request.ImageUrl);
        return Ok(result);
    }

    /// <summary>
    /// Détection chromatique IA par lot (plusieurs photos en parallèle sur le serveur)
    /// </summary>
    [HttpPost("detect-colors-batch")]
    [AllowAnonymous]
    public async Task<ActionResult<List<ColorDetectionResult>>> DetectColorsBatch([FromBody] DetectColorsBatchRequest request)
    {
        if (request.ImageUrls == null || request.ImageUrls.Count == 0)
        {
            return BadRequest(new { message = "Au moins une URL d'image est requise." });
        }

        _logger.LogInformation("Détection de couleurs par lot sur le serveur pour {Count} images", request.ImageUrls.Count);
        var results = await _colorDetectionService.DetectColorsBatchAsync(request.ImageUrls);
        return Ok(results);
    }

    /// <summary>
    /// Détection directe depuis un fichier envoyé au serveur (IFormFile)
    /// </summary>
    [HttpPost("detect-color-file")]
    [AllowAnonymous]
    public async Task<ActionResult<ColorDetectionResult>> DetectColorFromFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Fichier image requis." });
        }

        _logger.LogInformation("Détection de couleur directe sur le serveur pour le fichier : {FileName}", file.FileName);
        await using var stream = file.OpenReadStream();
        var result = await _colorDetectionService.DetectColorFromStreamAsync(stream);
        return Ok(result);
    }
}
