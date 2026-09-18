using System.ComponentModel.DataAnnotations;

namespace LeLaboratoire.Api.DTOs;

public record MarketResearchRequest(
    [Required] Guid ProductId,
    string? CustomSearchQuery = null
);

public record MarketResearchResponse(
    Guid ProductId,
    string ProductName,
    List<decimal> DetectedPrices,
    decimal MinObservedPrice,
    decimal MaxObservedPrice,
    decimal AveragePrice,
    decimal RecommendedCeilingPrice,
    decimal PsychologicalPrice,
    string StrategicAdvice,
    List<string> SourcesFound,
    DateTime AnalyzedAt
);
