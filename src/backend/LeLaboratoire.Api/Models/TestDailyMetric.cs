using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeLaboratoire.Api.Models;

public class TestDailyMetric
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProductTestId { get; set; }

    [ForeignKey(nameof(ProductTestId))]
    public ProductTest? ProductTest { get; set; }

    /// <summary>
    /// Day number of the test (1 to 6).
    /// </summary>
    public int DayNumber { get; set; }

    public DateTime MetricDate { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Advertising spend consumed on this specific day (in DA).
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal AdsSpent { get; set; }

    public int Impressions { get; set; }

    public int Clicks { get; set; }

    /// <summary>
    /// Number of confirmed customer orders delivered/shipped today.
    /// </summary>
    public int ConfirmedOrders { get; set; }

    /// <summary>
    /// Cumulative or daily revenue (ConfirmedOrders * SellingPrice).
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalRevenue { get; set; }

    /// <summary>
    /// Net Fayda calculated for this day or cumulative.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal NetFayda { get; set; }

    public string Notes { get; set; } = string.Empty;
}
