namespace LeLaboratoire.Api.Services;

public class ColorCandidate
{
    public string Name { get; set; } = string.Empty;
    public string Hex { get; set; } = string.Empty;
    public double Score { get; set; }
}

public class ColorDetectionResult
{
    public string ColorName { get; set; } = string.Empty;
    public string Hex { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public double Confidence { get; set; }
    public List<ColorCandidate> Candidates { get; set; } = new();
}

public interface IColorDetectionService
{
    Task<ColorDetectionResult> DetectColorFromUrlAsync(string imageUrl);
    Task<ColorDetectionResult> DetectColorFromStreamAsync(Stream stream);
    Task<List<ColorDetectionResult>> DetectColorsBatchAsync(List<string> imageUrls);
}
