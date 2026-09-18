using System.ComponentModel.DataAnnotations;

namespace LeLaboratoire.Api.DTOs;

public record StartTestDto(
    [Required] Guid ProductId,
    int InitialQuantity = 8,
    decimal? RasLmal = null, // If null, auto-calculated from Product.BuyPrice * InitialQuantity
    decimal AdsBudgetTotal = 2000.00m,
    decimal TicketBureauFee = 15.00m,
    [Required] decimal SellingPrice = 0.00m
);

public record LogDailyMetricDto(
    [Range(1, 6)] int DayNumber,
    [Required] decimal AdsSpent,
    int Impressions,
    int Clicks,
    [Required] int ConfirmedOrders,
    string? Notes
);

public record DailyMetricDto(
    Guid Id,
    int DayNumber,
    DateTime MetricDate,
    decimal AdsSpent,
    int Impressions,
    int Clicks,
    int ConfirmedOrders,
    decimal TotalRevenue,
    decimal NetFayda,
    decimal CTR,
    decimal? CPA,
    string Notes
);

public record SentinelAlert(
    string AlertType, // "CRITICAL_STOP", "PRICE_REDUCTION", "MAXIMIZE_MARGIN", "NORMAL"
    string Severity,  // "danger", "warning", "success", "info"
    string Title,
    string Message,
    string RecommendedAction
);

public record TestDetailDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductImageUrl,
    int InitialQuantity,
    int RemainingQuantity,
    decimal RasLmal,
    decimal AdsBudgetTotal,
    decimal TotalAdsSpent,
    decimal AdsBudgetRemaining,
    decimal TicketBureauFee,
    decimal SellingPrice,
    decimal? AIRecommendedPrice,
    string Status,
    DateTime StartDate,
    DateTime? EndDate,
    int CurrentDay,
    int TotalConfirmedOrders,
    decimal TotalRevenue,
    decimal TotalExpenses,
    decimal NetFayda,
    decimal ROI,
    List<DailyMetricDto> Metrics,
    List<SentinelAlert> ActiveAlerts
);

public record GlobalFaydaSummaryDto(
    int ActiveTestsCount,
    int CompletedTestsCount,
    decimal TotalRasLmalInvested,
    decimal TotalAdsConsumed,
    decimal TotalTicketBureauPaid,
    int TotalConfirmedOrders,
    decimal TotalRevenue,
    decimal TotalNetFayda,
    decimal OverallROI
);
