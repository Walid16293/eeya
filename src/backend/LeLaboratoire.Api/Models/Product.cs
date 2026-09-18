using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LeLaboratoire.Api.Models;

public class Product
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Category { get; set; } = "Général";

    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// Stored as JSONB in PostgreSQL (e.g. {"tailles": ["M", "L"], "couleurs": ["Noir", "Bleu"]})
    /// </summary>
    [Column(TypeName = "jsonb")]
    public string Specifications { get; set; } = "{}";

    [Column(TypeName = "decimal(18,2)")]
    public decimal BuyPrice { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal TargetSellPrice { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductTest> Tests { get; set; } = new List<ProductTest>();
}
