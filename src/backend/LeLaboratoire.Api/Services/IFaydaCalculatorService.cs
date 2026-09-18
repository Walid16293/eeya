using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Services;

public interface IFaydaCalculatorService
{
    (decimal TotalExpense, decimal TotalRevenue, decimal NetFayda, decimal Roi) CalculateFinancials(
        decimal rasLmal,
        decimal totalAdsSpent,
        int confirmedOrders,
        decimal ticketBureauFee,
        decimal sellingPrice
    );

    List<SentinelAlert> EvaluateSentinels(ProductTest test);

    decimal CalculatePsychologicalPrice(decimal basePrice);
}
