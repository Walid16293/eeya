using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Models;
using LeLaboratoire.Api.Services;

namespace LeLaboratoire.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TestsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IFaydaCalculatorService _calculatorService;
    private readonly ILogger<TestsController> _logger;

    public TestsController(AppDbContext context, IFaydaCalculatorService calculatorService, ILogger<TestsController> logger)
    {
        _context = context;
        _calculatorService = calculatorService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<TestDetailDto>>> GetAll()
    {
        var tests = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .OrderByDescending(t => t.StartDate)
            .ToListAsync();

        var result = tests.Select(MapToDetailDto).ToList();
        return Ok(result);
    }

    [HttpGet("active")]
    public async Task<ActionResult<TestDetailDto>> GetActive()
    {
        var test = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .FirstOrDefaultAsync(t => t.Status == "Active");

        if (test == null) return NotFound(new { message = "Aucun test actif actuellement." });

        return Ok(MapToDetailDto(test));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TestDetailDto>> GetById(Guid id)
    {
        var test = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        return Ok(MapToDetailDto(test));
    }

    [HttpPost("start")]
    public async Task<ActionResult<TestDetailDto>> StartTest([FromBody] StartTestDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return NotFound(new { message = "Marchandise introuvable." });

        // Ras Lmal : Soit spécifié, soit calculé automatiquement (Qté Initiale * Prix d'achat)
        decimal rasLmal = dto.RasLmal ?? (dto.InitialQuantity * product.BuyPrice);
        decimal sellingPrice = dto.SellingPrice > 0 ? dto.SellingPrice : product.TargetSellPrice;

        var test = new ProductTest
        {
            Id = Guid.NewGuid(),
            ProductId = dto.ProductId,
            InitialQuantity = dto.InitialQuantity,
            RemainingQuantity = dto.InitialQuantity,
            RasLmal = rasLmal,
            AdsBudgetTotal = dto.AdsBudgetTotal,
            TicketBureauFee = dto.TicketBureauFee,
            SellingPrice = sellingPrice,
            Status = "Active",
            StartDate = DateTime.UtcNow
        };

        _context.ProductTests.Add(test);
        await _context.SaveChangesAsync();

        // Reload with navigation
        await _context.Entry(test).Reference(t => t.Product).LoadAsync();
        await _context.Entry(test).Collection(t => t.Metrics).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = test.Id }, MapToDetailDto(test));
    }

    [HttpPost("{id:guid}/metrics")]
    public async Task<ActionResult<TestDetailDto>> LogDailyMetric(Guid id, [FromBody] LogDailyMetricDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var test = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        // Vérifier si la métrique pour ce jour existe déjà (mise à jour) ou création
        var existingMetric = test.Metrics.FirstOrDefault(m => m.DayNumber == dto.DayNumber);

        decimal dailyRevenue = dto.ConfirmedOrders * test.SellingPrice;
        
        // Recalcul du stock restant
        int previousOrdersForOtherDays = test.Metrics.Where(m => m.DayNumber != dto.DayNumber).Sum(m => m.ConfirmedOrders);
        int totalOrdersSoFar = previousOrdersForOtherDays + dto.ConfirmedOrders;
        test.RemainingQuantity = Math.Max(0, test.InitialQuantity - totalOrdersSoFar);

        // Calcul provisoire de la Fayda pour ce jour
        decimal dailyExpenses = (dto.DayNumber == 1 ? test.RasLmal : 0m) + dto.AdsSpent + (dto.ConfirmedOrders * test.TicketBureauFee);
        decimal dailyFayda = dailyRevenue - dailyExpenses;

        if (existingMetric != null)
        {
            existingMetric.AdsSpent = dto.AdsSpent;
            existingMetric.Impressions = dto.Impressions;
            existingMetric.Clicks = dto.Clicks;
            existingMetric.ConfirmedOrders = dto.ConfirmedOrders;
            existingMetric.TotalRevenue = dailyRevenue;
            existingMetric.NetFayda = dailyFayda;
            existingMetric.Notes = dto.Notes ?? string.Empty;
        }
        else
        {
            var metric = new TestDailyMetric
            {
                Id = Guid.NewGuid(),
                ProductTestId = test.Id,
                DayNumber = dto.DayNumber,
                MetricDate = DateTime.UtcNow,
                AdsSpent = dto.AdsSpent,
                Impressions = dto.Impressions,
                Clicks = dto.Clicks,
                ConfirmedOrders = dto.ConfirmedOrders,
                TotalRevenue = dailyRevenue,
                NetFayda = dailyFayda,
                Notes = dto.Notes ?? string.Empty
            };
            _context.TestDailyMetrics.Add(metric);
        }

        // Si Jour 6 atteint ou stock épuisé, on peut suggérer la clôture
        if (dto.DayNumber >= 6 || test.RemainingQuantity == 0)
        {
            test.EndDate = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(test));
    }

    [HttpPost("{id:guid}/complete")]
    public async Task<ActionResult<TestDetailDto>> CompleteTest(Guid id)
    {
        var test = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        test.Status = "Completed";
        test.EndDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(test));
    }

    [HttpPost("{id:guid}/abort")]
    public async Task<ActionResult<TestDetailDto>> AbortTest(Guid id)
    {
        var test = await _context.ProductTests
            .Include(t => t.Product)
            .Include(t => t.Metrics)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (test == null) return NotFound();

        test.Status = "Aborted";
        test.EndDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(MapToDetailDto(test));
    }

    [HttpGet("summary/global")]
    public async Task<ActionResult<GlobalFaydaSummaryDto>> GetGlobalSummary()
    {
        var tests = await _context.ProductTests
            .Include(t => t.Metrics)
            .ToListAsync();

        int activeCount = tests.Count(t => t.Status == "Active");
        int completedCount = tests.Count(t => t.Status == "Completed" || t.Status == "Aborted");

        decimal totalRasLmal = tests.Sum(t => t.RasLmal);
        decimal totalAds = tests.SelectMany(t => t.Metrics).Sum(m => m.AdsSpent);
        int totalOrders = tests.SelectMany(t => t.Metrics).Sum(m => m.ConfirmedOrders);
        decimal totalTicketBureau = tests.Sum(t => t.TicketBureauFee * t.Metrics.Sum(m => m.ConfirmedOrders));
        decimal totalRevenue = tests.Sum(t => t.SellingPrice * t.Metrics.Sum(m => m.ConfirmedOrders));

        decimal totalExpenses = totalRasLmal + totalAds + totalTicketBureau;
        decimal netFayda = totalRevenue - totalExpenses;
        decimal overallRoi = totalExpenses > 0 ? Math.Round((netFayda / totalExpenses) * 100m, 2) : 0m;

        return Ok(new GlobalFaydaSummaryDto(
            ActiveTestsCount: activeCount,
            CompletedTestsCount: completedCount,
            TotalRasLmalInvested: totalRasLmal,
            TotalAdsConsumed: totalAds,
            TotalTicketBureauPaid: totalTicketBureau,
            TotalConfirmedOrders: totalOrders,
            TotalRevenue: totalRevenue,
            TotalNetFayda: netFayda,
            OverallROI: overallRoi
        ));
    }

    private TestDetailDto MapToDetailDto(ProductTest test)
    {
        var metrics = test.Metrics.OrderBy(m => m.DayNumber).ToList();
        int currentDay = metrics.Any() ? metrics.Max(m => m.DayNumber) : 0;

        decimal totalAdsSpent = metrics.Sum(m => m.AdsSpent);
        int totalOrders = metrics.Sum(m => m.ConfirmedOrders);

        var (totalExpense, totalRevenue, netFayda, roi) = _calculatorService.CalculateFinancials(
            test.RasLmal,
            totalAdsSpent,
            totalOrders,
            test.TicketBureauFee,
            test.SellingPrice
        );

        var activeAlerts = _calculatorService.EvaluateSentinels(test);

        var metricDtos = metrics.Select(m => new DailyMetricDto(
            m.Id,
            m.DayNumber,
            m.MetricDate,
            m.AdsSpent,
            m.Impressions,
            m.Clicks,
            m.ConfirmedOrders,
            m.TotalRevenue,
            m.NetFayda,
            m.Impressions > 0 ? Math.Round(((decimal)m.Clicks / m.Impressions) * 100m, 2) : 0m,
            m.ConfirmedOrders > 0 ? Math.Round(m.AdsSpent / m.ConfirmedOrders, 2) : null,
            m.Notes
        )).ToList();

        return new TestDetailDto(
            Id: test.Id,
            ProductId: test.ProductId,
            ProductName: test.Product?.Name ?? "Inconnu",
            ProductImageUrl: test.Product?.ImageUrl ?? "",
            InitialQuantity: test.InitialQuantity,
            RemainingQuantity: test.RemainingQuantity,
            RasLmal: test.RasLmal,
            AdsBudgetTotal: test.AdsBudgetTotal,
            TotalAdsSpent: totalAdsSpent,
            AdsBudgetRemaining: Math.Max(0, test.AdsBudgetTotal - totalAdsSpent),
            TicketBureauFee: test.TicketBureauFee,
            SellingPrice: test.SellingPrice,
            AIRecommendedPrice: test.AIRecommendedPrice,
            Status: test.Status,
            StartDate: test.StartDate,
            EndDate: test.EndDate,
            CurrentDay: currentDay,
            TotalConfirmedOrders: totalOrders,
            TotalRevenue: totalRevenue,
            TotalExpenses: totalExpense,
            NetFayda: netFayda,
            ROI: roi,
            Metrics: metricDtos,
            ActiveAlerts: activeAlerts
        );
    }
}
