using System.ComponentModel.DataAnnotations;

namespace LeLaboratoire.Api.DTOs;

public record CreateProductDto(
    [Required] string Name,
    string Category,
    string ImageUrl,
    string Specifications, // JSON string
    [Required] decimal BuyPrice,
    decimal TargetSellPrice
);

public record UpdateProductDto(
    string? Name,
    string? Category,
    string? ImageUrl,
    string? Specifications,
    decimal? BuyPrice,
    decimal? TargetSellPrice
);

public record ProductDto(
    Guid Id,
    string Name,
    string Category,
    string ImageUrl,
    string Specifications,
    decimal BuyPrice,
    decimal TargetSellPrice,
    DateTime CreatedAt,
    int TotalTestsCount,
    bool HasActiveTest
);
