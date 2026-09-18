namespace LeLaboratoire.Api.Services;

public record MannequinViewsResult(
    string Front,
    string Side,
    string Back,
    string ColorName,
    string Hex,
    string Category
);

public interface IMannequinService
{
    Task<MannequinViewsResult> GenerateViewsAsync(string colorName, string hex, string? category = null, string? sourceImageUrl = null);
    Task<List<MannequinViewsResult>> GenerateViewsBatchAsync(List<(string ColorName, string Hex, string? Category, string? SourceImageUrl)> items);
    Task<byte[]?> GetMannequinImageAsync(string hex, string angle, string? category = null, string? colorName = null);
}
