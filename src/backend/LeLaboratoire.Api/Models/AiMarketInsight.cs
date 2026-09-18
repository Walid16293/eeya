using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeLaboratoire.Api.Models;

public class AiMarketInsight
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid ProductId { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product? Product { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinObservedPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal MaxObservedPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal AveragePrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal RecommendedCeilingPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal PsychologicalPrice { get; set; }

    [Column(TypeName = "jsonb")]
    public string RawJsonData { get; set; } = "{}";

    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}
