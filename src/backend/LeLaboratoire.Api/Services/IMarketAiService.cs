using LeLaboratoire.Api.DTOs;

namespace LeLaboratoire.Api.Services;

public interface IMarketAiService
{
    Task<MarketResearchResponse> AnalyzeMarketPriceAsync(Guid productId, string productName, string? customQuery = null);
}
