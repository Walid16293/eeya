using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Services;

public class FaydaCalculatorService : IFaydaCalculatorService
{
    public (decimal TotalExpense, decimal TotalRevenue, decimal NetFayda, decimal Roi) CalculateFinancials(
        decimal rasLmal,
        decimal totalAdsSpent,
        int confirmedOrders,
        decimal ticketBureauFee,
        decimal sellingPrice)
    {
        // 1. Dépense Totale = Ras Lmal + Total Ads Consommé + (Ventes Confirmées * Ticket Bureau)
        decimal totalExpense = rasLmal + totalAdsSpent + (confirmedOrders * ticketBureauFee);

        // 2. Revenu Total = Ventes Confirmées * Prix de Vente Unitaire
        decimal totalRevenue = confirmedOrders * sellingPrice;

        // 3. Fayda (Bénéfice Net) = Revenu Total - Dépense Totale
        decimal netFayda = totalRevenue - totalExpense;

        // 4. ROI = (Fayda / Dépense Totale) * 100
        decimal roi = totalExpense > 0 ? Math.Round((netFayda / totalExpense) * 100m, 2) : 0m;

        return (totalExpense, totalRevenue, netFayda, roi);
    }

    public List<SentinelAlert> EvaluateSentinels(ProductTest test)
    {
        var alerts = new List<SentinelAlert>();
        var metrics = test.Metrics.OrderBy(m => m.DayNumber).ToList();

        int currentDay = metrics.Any() ? metrics.Max(m => m.DayNumber) : 0;
        decimal totalAdsSpent = metrics.Sum(m => m.AdsSpent);
        int totalClicks = metrics.Sum(m => m.Clicks);
        int totalImpressions = metrics.Sum(m => m.Impressions);
        int totalOrders = metrics.Sum(m => m.ConfirmedOrders);

        // --- SENTINELLE 3 : ARRÊT D'URGENCE (Priorité Absolue) ---
        // Condition : Plus de 60% du budget Ads consommé sans vente
        decimal budgetConsumptionRatio = test.AdsBudgetTotal > 0 ? (totalAdsSpent / test.AdsBudgetTotal) : 0m;
        if (budgetConsumptionRatio >= 0.60m && totalOrders == 0)
        {
            alerts.Add(new SentinelAlert(
                AlertType: "CRITICAL_STOP",
                Severity: "danger",
                Title: "🚨 Arrêt d'Urgence : Stopper les Ads !",
                Message: $"{Math.Round(budgetConsumptionRatio * 100)}% du budget sponsoring consommé ({totalAdsSpent:N0} DA / {test.AdsBudgetTotal:N0} DA) sans aucune commande.",
                RecommendedAction: "Coupez immédiatement la campagne publicitaire Meta pour préserver le reste de votre budget."
            ));
        }

        // --- SENTINELLE 1 : ALERTE PRIX TROP ÉLEVÉ (Jour >= 3) ---
        // Condition : Jour >= 3, CTR > 2% et 0 vente
        decimal avgCtr = totalImpressions > 0 ? ((decimal)totalClicks / totalImpressions) * 100m : 0m;
        if (currentDay >= 3 && avgCtr >= 2.0m && totalOrders == 0)
        {
            decimal suggestedPrice = CalculatePsychologicalPrice(test.SellingPrice * 0.88m); // -12% avec arrondi psychologique
            alerts.Add(new SentinelAlert(
                AlertType: "PRICE_REDUCTION",
                Severity: "warning",
                Title: "⚠️ Alerte Prix : Blocage de Conversion",
                Message: $"CTR élevé ({avgCtr:F1}%) confirmant l'intérêt client, mais 0 vente au Jour {currentDay}. Le prix freine l'achat.",
                RecommendedAction: $"Baissez le prix de vente à {suggestedPrice:N0} DA pour déclencher les commandes."
            ));
        }

        // --- SENTINELLE 2 : OPPORTUNITÉ DE MAXIMISATION ---
        // Condition : Écoulement rapide du stock (reste <= 25%) à Jour <= 4 avec faible CPA
        decimal remainingStockRatio = test.InitialQuantity > 0 ? ((decimal)test.RemainingQuantity / test.InitialQuantity) : 0m;
        decimal cpa = totalOrders > 0 ? (totalAdsSpent / totalOrders) : 0m;
        bool lowCpa = totalOrders > 0 && test.SellingPrice > 0 && (cpa <= 0.25m * test.SellingPrice);

        if (remainingStockRatio <= 0.25m && currentDay <= 4 && totalOrders >= 2 && lowCpa)
        {
            decimal suggestedUpPrice = CalculatePsychologicalPrice(test.SellingPrice * 1.15m); // +15%
            alerts.Add(new SentinelAlert(
                AlertType: "MAXIMIZE_MARGIN",
                Severity: "success",
                Title: "🚀 Forte Demande : Maximisez votre Fayda !",
                Message: $"Stock presque épuisé ({test.RemainingQuantity} pièces restantes) au Jour {currentDay} avec un CPA très attractif ({cpa:N0} DA).",
                RecommendedAction: $"Augmentez le prix à {suggestedUpPrice:N0} DA sur le stock restant pour maximiser le bénéfice net."
            ));
        }

        if (!alerts.Any() && currentDay > 0)
        {
            alerts.Add(new SentinelAlert(
                AlertType: "NORMAL",
                Severity: "info",
                Title: "✅ Test en Progression Normale",
                Message: $"Jour {currentDay}/6 : Progression conforme aux prévisions du Laboratoire.",
                RecommendedAction: "Continuez la collecte quotidienne des métriques le soir."
            ));
        }

        return alerts;
    }

    public decimal CalculatePsychologicalPrice(decimal basePrice)
    {
        if (basePrice <= 0) return 0m;

        // Arrondi psychologique adapté au marché algérien :
        // - Si > 1500 DA : finissant en 900 DA ou 990 DA (ex: 3000 -> 2900 DA, 4200 -> 3900 DA)
        // - Si < 1500 DA : finissant en 90 DA (ex: 800 -> 790 DA, 1200 -> 1190 DA)
        long rounded = (long)Math.Round(basePrice);

        if (rounded >= 2000)
        {
            long hundreds = (rounded / 1000) * 1000;
            if (rounded >= hundreds + 500)
            {
                // ex: 2600 -> 2490 ou 2500
                return hundreds + 490;
            }
            else
            {
                // ex: 2200 -> 1900 ou 2000 -> 1900
                return (hundreds > 1000 ? hundreds - 1000 : 0) + 900;
            }
        }
        else if (rounded >= 1000)
        {
            return (rounded / 100) * 100 - 10; // ex: 1200 -> 1190
        }
        else
        {
            return Math.Max(100, (rounded / 50) * 50 - 10); // ex: 600 -> 590
        }
    }
}
