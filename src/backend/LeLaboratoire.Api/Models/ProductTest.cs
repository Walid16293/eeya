using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeLaboratoire.Api.Models;

public class ProductTest
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProductId { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product? Product { get; set; }

    public int InitialQuantity { get; set; } = 8;

    public int RemainingQuantity { get; set; } = 8;

    /// <summary>
    /// Ras Lmal: Total capital invested in this test stock (InitialQuantity * BuyPrice).
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal RasLmal { get; set; }

    /// <summary>
    /// Total sponsoring budget allocated (Default: 2,000 DA over 6 days).
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal AdsBudgetTotal { get; set; } = 2000.00m;

    /// <summary>
    /// Ticket de bureau: logistics fee per delivered order (Default: 15 DA).
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal TicketBureauFee { get; set; } = 15.00m;

    /// <summary>
    /// Effective selling price for this test.
    /// </summary>
    [Column(TypeName = "decimal(18,2)")]
    public decimal SellingPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? AIRecommendedPrice { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Active"; // Active, Paused, Completed, Aborted

    public DateTime StartDate { get; set; } = DateTime.UtcNow;

    public DateTime? EndDate { get; set; }

    public ICollection<TestDailyMetric> Metrics { get; set; } = new List<TestDailyMetric>();
}
