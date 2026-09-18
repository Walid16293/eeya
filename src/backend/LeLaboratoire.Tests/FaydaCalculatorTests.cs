using LeLaboratoire.Api.Models;
using LeLaboratoire.Api.Services;
using Xunit;

namespace LeLaboratoire.Tests;

public class FaydaCalculatorTests
{
    private readonly FaydaCalculatorService _calculator = new();

    [Fact]
    public void Financials_CalculatesExactFaydaAndRoi()
    {
        // 8 pièces achetées à 1 000 DA = Ras Lmal 8 000 DA
        decimal rasLmal = 8000.00m;
        decimal totalAds = 2000.00m;
        int confirmedOrders = 6;
        decimal ticketBureau = 15.00m;
        decimal sellingPrice = 2500.00m;

        var (totalExpense, totalRevenue, netFayda, roi) = _calculator.CalculateFinancials(
            rasLmal,
            totalAds,
            confirmedOrders,
            ticketBureau,
            sellingPrice
        );

        // Assertions mathématiques strictes
        Assert.Equal(10090.00m, totalExpense); // 8000 + 2000 + (6 * 15) = 10 090 DA
        Assert.Equal(15000.00m, totalRevenue); // 6 * 2500 = 15 000 DA
        Assert.Equal(4910.00m, netFayda);      // 15000 - 10090 = +4 910 DA
        Assert.Equal(48.66m, roi);             // (4910 / 10090) * 100 = 48.66%
    }

    [Fact]
    public void Sentinel_TriggersCriticalStop_WhenOver60PercentAdsSpentWithNoSales()
    {
        var test = new ProductTest
        {
            InitialQuantity = 8,
            RemainingQuantity = 8,
            RasLmal = 8000m,
            AdsBudgetTotal = 2000m,
            TicketBureauFee = 15m,
            SellingPrice = 2900m,
            Metrics = new List<TestDailyMetric>
            {
                new() { DayNumber = 1, AdsSpent = 400m, Impressions = 1000, Clicks = 10, ConfirmedOrders = 0 },
                new() { DayNumber = 2, AdsSpent = 450m, Impressions = 1200, Clicks = 12, ConfirmedOrders = 0 },
                new() { DayNumber = 3, AdsSpent = 400m, Impressions = 900, Clicks = 8, ConfirmedOrders = 0 }
            }
        };

        // Total Ads dépensé = 1 250 DA (62.5% du budget de 2 000 DA)
        var alerts = _calculator.EvaluateSentinels(test);

        Assert.Contains(alerts, a => a.AlertType == "CRITICAL_STOP");
        var stopAlert = alerts.First(a => a.AlertType == "CRITICAL_STOP");
        Assert.Equal("danger", stopAlert.Severity);
        Assert.Contains("Arrêt d'Urgence", stopAlert.Title);
    }

    [Fact]
    public void Sentinel_TriggersPriceReduction_WhenCtrHighAndNoSalesAtDay3()
    {
        var test = new ProductTest
        {
            InitialQuantity = 8,
            RemainingQuantity = 8,
            RasLmal = 8000m,
            AdsBudgetTotal = 2000m,
            TicketBureauFee = 15m,
            SellingPrice = 3500m,
            Metrics = new List<TestDailyMetric>
            {
                new() { DayNumber = 1, AdsSpent = 250m, Impressions = 1000, Clicks = 25, ConfirmedOrders = 0 },
                new() { DayNumber = 2, AdsSpent = 250m, Impressions = 1000, Clicks = 25, ConfirmedOrders = 0 },
                new() { DayNumber = 3, AdsSpent = 250m, Impressions = 1000, Clicks = 25, ConfirmedOrders = 0 }
            }
        };

        // CTR = 75 / 3000 = 2.5% >= 2.0%, Jour = 3, Ventes = 0
        var alerts = _calculator.EvaluateSentinels(test);

        Assert.Contains(alerts, a => a.AlertType == "PRICE_REDUCTION");
        var priceAlert = alerts.First(a => a.AlertType == "PRICE_REDUCTION");
        Assert.Equal("warning", priceAlert.Severity);
        Assert.Contains("Blocage de Conversion", priceAlert.Title);
    }

    [Fact]
    public void Sentinel_TriggersMaximizeMargin_WhenStockLowWithLowCpa()
    {
        var test = new ProductTest
        {
            InitialQuantity = 8,
            RemainingQuantity = 2, // 2 / 8 = 25% <= 25%
            RasLmal = 8000m,
            AdsBudgetTotal = 2000m,
            TicketBureauFee = 15m,
            SellingPrice = 3000m,
            Metrics = new List<TestDailyMetric>
            {
                new() { DayNumber = 1, AdsSpent = 300m, Impressions = 1000, Clicks = 30, ConfirmedOrders = 2 },
                new() { DayNumber = 2, AdsSpent = 300m, Impressions = 1000, Clicks = 30, ConfirmedOrders = 2 },
                new() { DayNumber = 3, AdsSpent = 300m, Impressions = 1000, Clicks = 30, ConfirmedOrders = 2 }
            }
        };

        // Jour 3 <= 4, 6 commandes, CPA = 900 / 6 = 150 DA (<= 25% de 3 000 = 750 DA)
        var alerts = _calculator.EvaluateSentinels(test);

        Assert.Contains(alerts, a => a.AlertType == "MAXIMIZE_MARGIN");
        var boostAlert = alerts.First(a => a.AlertType == "MAXIMIZE_MARGIN");
        Assert.Equal("success", boostAlert.Severity);
        Assert.Contains("Maximisez votre Fayda", boostAlert.Title);
    }

    [Theory]
    [InlineData(3000, 2900)]
    [InlineData(4000, 3900)]
    [InlineData(1200, 1190)]
    [InlineData(600, 590)]
    public void PsychologicalPrice_RoundsAppropriately(decimal input, decimal expected)
    {
        var result = _calculator.CalculatePsychologicalPrice(input);
        Assert.Equal(expected, result);
    }
}
