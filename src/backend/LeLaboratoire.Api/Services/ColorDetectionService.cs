using System.Net.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace LeLaboratoire.Api.Services;

public class ColorDetectionService : IColorDetectionService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ColorDetectionService> _logger;

    private static readonly List<(string Name, string Hex, byte R, byte G, byte B, string Category)> FashionPalette = new()
    {
        ("Rose Poudré & Carreaux", "#f4b8c9", 244, 184, 201, "rose"),
        ("Marron Caramel & Carreaux", "#b06d40", 176, 109, 64, "caramel"),
        ("Noir & Carreaux", "#1c1917", 28, 25, 23, "noir"),
        ("Vert Sauge & Rayures", "#a3b18a", 163, 177, 138, "vert"),
        ("Blanc Crème & Carreaux", "#f5ebe0", 245, 235, 224, "blanc"),
        ("Rose Pastel", "#fbcfe8", 251, 207, 232, "rose"),
        ("Vieux Rose", "#d8839b", 216, 131, 155, "rose"),
        ("Chocolat / Moka", "#582f17", 88, 47, 23, "caramel"),
        ("Terracotta", "#c85a32", 200, 90, 50, "caramel"),
        ("Gris Anthracite", "#475569", 71, 85, 105, "noir"),
        ("Vert Kaki / Olive", "#656d4a", 101, 109, 74, "vert"),
        ("Bleu Ciel", "#bae6fd", 186, 230, 253, "bleu"),
        ("Bleu Marine", "#1e3a8a", 30, 58, 138, "bleu"),
        ("Bordeaux & Lilas", "#881337", 136, 19, 55, "bordeaux")
    };

    public ColorDetectionService(HttpClient httpClient, ILogger<ColorDetectionService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<ColorDetectionResult> DetectColorFromUrlAsync(string imageUrl)
    {
        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, imageUrl);
            req.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Eya-ColorDetector/1.0");

            var res = await _httpClient.SendAsync(req);
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Échec du téléchargement de l'image pour analyse couleur : {Url}, Statut: {Status}", imageUrl, res.StatusCode);
                return GetDefaultResult();
            }

            await using var stream = await res.Content.ReadAsStreamAsync();
            return await DetectColorFromStreamAsync(stream);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de la détection de couleur depuis l'URL : {Url}", imageUrl);
            return GetDefaultResult();
        }
    }

    public async Task<ColorDetectionResult> DetectColorFromStreamAsync(Stream stream)
    {
        try
        {
            using var image = await Image.LoadAsync<Rgba32>(stream);

            // Redimensionner à 120x120 pour analyse ultrarapide et efficace
            image.Mutate(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(120, 120),
                Mode = ResizeMode.Crop
            }));

            var scores = new Dictionary<string, (string Hex, string Category, double Score)>();
            foreach (var item in FashionPalette)
            {
                scores[item.Name] = (item.Hex, item.Category, 0);
            }

            // Zone centrale du tissu (20% à 80% pour éliminer sols, carrelages, bordures)
            int startX = 24;
            int endX = 96;
            int startY = 24;
            int endY = 96;

            for (int y = startY; y < endY; y += 2)
            {
                for (int x = startX; x < endX; x += 2)
                {
                    var pixel = image[x, y];
                    if (pixel.A < 128) continue;

                    int r = pixel.R;
                    int g = pixel.G;
                    int b = pixel.B;

                    int max = Math.Max(r, Math.Max(g, b));
                    int min = Math.Min(r, Math.Min(g, b));
                    int chroma = max - min;
                    int lightness = (max + min) / 2;

                    // Ignorer les zones blanches aveuglantes / reflets
                    if (lightness > 245 && chroma < 12) continue;

                    // Pondération forte sur les pixels saturés du vêtement
                    double weight = 1.0;
                    if (chroma > 18)
                    {
                        weight = 3.5;
                    }
                    else if (lightness < 35)
                    {
                        weight = 2.5; // Tissu sombre / noir
                    }

                    var closest = FindClosestFashionColor(r, g, b);
                    if (scores.TryGetValue(closest.Name, out var curr))
                    {
                        scores[closest.Name] = (curr.Hex, curr.Category, curr.Score + weight);
                    }
                }
            }

            var sorted = scores
                .Where(kv => kv.Value.Score > 0)
                .OrderByDescending(kv => kv.Value.Score)
                .ToList();

            if (sorted.Count > 0)
            {
                var top = sorted[0];
                var totalScore = sorted.Sum(s => s.Value.Score);
                var confidence = totalScore > 0 ? Math.Round(top.Value.Score / totalScore, 2) : 0.85;

                return new ColorDetectionResult
                {
                    ColorName = top.Key,
                    Hex = top.Value.Hex,
                    Category = top.Value.Category,
                    Confidence = Math.Min(0.98, Math.Max(0.70, confidence)),
                    Candidates = sorted.Take(3).Select(s => new ColorCandidate
                    {
                        Name = s.Key,
                        Hex = s.Value.Hex,
                        Score = s.Value.Score
                    }).ToList()
                };
            }

            return GetDefaultResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur analyse de pixels dans DetectColorFromStreamAsync");
            return GetDefaultResult();
        }
    }

    public async Task<List<ColorDetectionResult>> DetectColorsBatchAsync(List<string> imageUrls)
    {
        if (imageUrls == null || imageUrls.Count == 0)
            return new List<ColorDetectionResult>();

        var tasks = imageUrls.Select(DetectColorFromUrlAsync);
        var results = await Task.WhenAll(tasks);
        return results.ToList();
    }

    private static (string Name, string Hex, string Category) FindClosestFashionColor(int r, int g, int b)
    {
        double minDistance = double.MaxValue;
        var best = FashionPalette[0];

        foreach (var p in FashionPalette)
        {
            double dist = ColorDistance(r, g, b, p.R, p.G, p.B);
            if (dist < minDistance)
            {
                minDistance = dist;
                best = p;
            }
        }

        return (best.Name, best.Hex, best.Category);
    }

    private static double ColorDistance(int r1, int g1, int b1, int r2, int g2, int b2)
    {
        long rmean = (r1 + r2) / 2;
        long r = r1 - r2;
        long g = g1 - g2;
        long b = b1 - b2;
        return Math.Sqrt((((512 + rmean) * r * r) >> 8) + 4 * g * g + (((767 - rmean) * b * b) >> 8));
    }

    private static ColorDetectionResult GetDefaultResult()
    {
        return new ColorDetectionResult
        {
            ColorName = "Rose Poudré & Carreaux",
            Hex = "#f4b8c9",
            Category = "rose",
            Confidence = 0.85,
            Candidates = new List<ColorCandidate>
            {
                new() { Name = "Rose Poudré & Carreaux", Hex = "#f4b8c9", Score = 100 }
            }
        };
    }
}
