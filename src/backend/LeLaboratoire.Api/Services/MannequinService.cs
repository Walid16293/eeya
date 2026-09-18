using System.Globalization;
using Microsoft.Extensions.Caching.Memory;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.PixelFormats;

namespace LeLaboratoire.Api.Services;

public class MannequinService : IMannequinService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MannequinService> _logger;
    private readonly string _assetsDir;

    public MannequinService(IMemoryCache cache, ILogger<MannequinService> logger, IWebHostEnvironment env)
    {
        _cache = cache;
        _logger = logger;

        // Détection de l'emplacement des gabarits salon mannequin
        string candidate1 = Path.Combine(AppContext.BaseDirectory, "Assets", "Mannequin");
        string candidate2 = Path.Combine(env.ContentRootPath, "Assets", "Mannequin");
        string candidate3 = Path.Combine(Directory.GetCurrentDirectory(), "Assets", "Mannequin");

        if (Directory.Exists(candidate1)) _assetsDir = candidate1;
        else if (Directory.Exists(candidate2)) _assetsDir = candidate2;
        else if (Directory.Exists(candidate3)) _assetsDir = candidate3;
        else _assetsDir = candidate1;

        _logger.LogInformation("MannequinService initialisé avec le répertoire d'actifs : {AssetsDir}", _assetsDir);
    }

    public Task<MannequinViewsResult> GenerateViewsAsync(string colorName, string hex, string? category = null, string? sourceImageUrl = null)
    {
        string cleanHex = NormalizeHex(hex);
        string cat = string.IsNullOrWhiteSpace(category) ? "Pyjamas" : category.Trim();
        string encodedColor = Uri.EscapeDataString(colorName ?? "Couleur");
        string encodedCat = Uri.EscapeDataString(cat);

        // URLs de streaming pérennes générées en ligne par l'API
        string frontUrl = $"/api/ai/mannequin-image?hex={cleanHex}&angle=front&cat={encodedCat}&color={encodedColor}";
        string sideUrl = $"/api/ai/mannequin-image?hex={cleanHex}&angle=side&cat={encodedCat}&color={encodedColor}";
        string backUrl = $"/api/ai/mannequin-image?hex={cleanHex}&angle=back&cat={encodedCat}&color={encodedColor}";

        var result = new MannequinViewsResult(frontUrl, sideUrl, backUrl, colorName ?? "Couleur", hex ?? "#f4b8c9", cat);
        return Task.FromResult(result);
    }

    public async Task<List<MannequinViewsResult>> GenerateViewsBatchAsync(List<(string ColorName, string Hex, string? Category, string? SourceImageUrl)> items)
    {
        var list = new List<MannequinViewsResult>();
        foreach (var item in items)
        {
            var res = await GenerateViewsAsync(item.ColorName, item.Hex, item.Category, item.SourceImageUrl);
            list.Add(res);
        }
        return list;
    }

    public async Task<byte[]?> GetMannequinImageAsync(string hex, string angle, string? category = null, string? colorName = null)
    {
        string cleanHex = NormalizeHex(hex);
        string cleanAngle = (angle ?? "front").ToLower().Trim();
        if (cleanAngle != "front" && cleanAngle != "side" && cleanAngle != "back")
        {
            cleanAngle = "front";
        }

        string cat = (category ?? "pyjamas").ToLower().Trim();
        string cacheKey = $"mannequin_{cleanAngle}_{cleanHex}_{cat}";

        if (_cache.TryGetValue(cacheKey, out byte[]? cachedBytes) && cachedBytes != null)
        {
            return cachedBytes;
        }

        byte[]? generated = await Task.Run(() => RenderMannequinAngle(cleanHex, cleanAngle, cat, colorName));
        if (generated != null)
        {
            _cache.Set(cacheKey, generated, TimeSpan.FromHours(24));
        }

        return generated;
    }

    private byte[]? RenderMannequinAngle(string hex, string angle, string category, string? colorName)
    {
        try
        {
            // 1. Parsing de la couleur cible
            if (!TryParseHex(hex, out byte targetR, out byte targetG, out byte targetB))
            {
                // Couleur par défaut : Rose Poudré Signature Eya
                targetR = 244;
                targetG = 184;
                targetB = 201;
            }

            // 2. Si c'est un pyjama standard et qu'un preset HD direct existe
            bool isPyjama = category.Contains("pyjama") || (!category.Contains("short") && !category.Contains("robe") && !category.Contains("tricot") && !category.Contains("pull") && !category.Contains("pantalon"));
            if (isPyjama)
            {
                string? presetFile = MatchPresetFile(hex, angle, colorName);
                if (presetFile != null && File.Exists(presetFile))
                {
                    return File.ReadAllBytes(presetFile);
                }
            }

            // 3. Synthèse chromatique dynamique selon la catégorie et l'angle
            string baseFileName = angle switch
            {
                "side" => "mannequin_salon_side.png",
                "back" => "mannequin_salon_back.png",
                _ => "mannequin_salon_front.png"
            };

            string basePath = Path.Combine(_assetsDir, baseFileName);
            if (!File.Exists(basePath))
            {
                _logger.LogWarning("Fichier de base introuvable : {Path}", basePath);
                return null;
            }

            using var img = Image.Load<Rgba32>(basePath);

            // Définition des zones selon la catégorie
            bool isTricot = category.Contains("tricot") || category.Contains("pull") || category.Contains("haut") || category.Contains("chemise");
            bool isShort = category.Contains("short");
            bool isRobe = category.Contains("robe") || category.Contains("abaya");
            bool isPantalon = category.Contains("pantalon") || category.Contains("jupe") || category.Contains("bas");

            int maxY = isTricot ? 640 : (isShort ? 870 : (isRobe ? 1020 : 1110));
            int minY = isPantalon ? 640 : 370;

            img.ProcessPixelRows(accessor =>
            {
                for (int y = 0; y < accessor.Height; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (int x = 0; x < row.Length; x++)
                    {
                        ref Rgba32 pixel = ref row[x];

                        // Silhouette générale du mannequin
                        if (x < 255 || x > 520) continue;
                        if (y < minY || y > maxY) continue;

                        // Angle de Face : exclusion encolure incurvée et bras en bois
                        if (angle == "front")
                        {
                            double neckDx = (x - 385.0) / 78.0;
                            double neckDy = (y - 380.0) / 72.0;
                            if ((neckDx * neckDx + neckDy * neckDy) <= 1.0) continue;

                            // Bras en bois
                            if (x < 280 && y > 430 && y < 600) continue;
                            if (x > 490 && y > 430 && y < 600) continue;

                            // Tige métallique entre les jambes
                            if (x >= 378 && x <= 392 && y >= 800)
                            {
                                if (Math.Abs(pixel.R - pixel.G) < 12 && Math.Abs(pixel.G - pixel.B) < 12) continue;
                            }
                        }
                        else if (angle == "side")
                        {
                            // Encolure profil
                            if (x >= 340 && x <= 420 && y < 440) continue;
                            if (x < 270 || x > 490) continue;
                        }
                        else if (angle == "back")
                        {
                            // Dos : pas d'encolure basse
                            if (y < 350) continue;
                            if (x < 270 || x > 495) continue;
                        }

                        // Préservation des liserés blancs, cordons et imprimés
                        float maxC = Math.Max(pixel.R, Math.Max(pixel.G, pixel.B));
                        float minC = Math.Min(pixel.R, Math.Min(pixel.G, pixel.B));
                        float sat = maxC > 0 ? (maxC - minC) / maxC : 0;
                        if (maxC > 210 && sat < 0.14f) continue;

                        // Identification du tissu du vêtement
                        bool isTop = y <= 640;
                        int rDiffG = pixel.R - pixel.G;
                        int rDiffB = pixel.R - pixel.B;

                        bool isGarment = isTop
                            ? (rDiffG >= 14 && rDiffB >= 12 && sat >= 0.10f)
                            : (rDiffB >= 30 && rDiffG >= 14);

                        if (isGarment)
                        {
                            // Conservation de la texture, du grain et des plis d'ombrage
                            float origLum = 0.299f * pixel.R + 0.587f * pixel.G + 0.114f * pixel.B;
                            float factor = origLum / 175.0f;

                            int newR = Math.Clamp((int)(targetR * factor), 0, 255);
                            int newG = Math.Clamp((int)(targetG * factor), 0, 255);
                            int newB = Math.Clamp((int)(targetB * factor), 0, 255);

                            pixel.R = (byte)newR;
                            pixel.G = (byte)newG;
                            pixel.B = (byte)newB;
                        }
                    }
                }
            });

            using var ms = new MemoryStream();
            img.SaveAsJpeg(ms, new JpegEncoder { Quality = 92 });
            return ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du rendu de l'angle mannequin : {Angle}, Hex: {Hex}", angle, hex);
            return null;
        }
    }

    private string? MatchPresetFile(string hex, string angle, string? colorName)
    {
        string c = (colorName ?? "").ToLower();
        string h = hex.ToLower();

        // 1. Noir
        if (c.Contains("noir") || c.Contains("black") || h == "1c1917" || h == "000000" || h == "262626")
        {
            string f = Path.Combine(_assetsDir, $"mannequin_noir_{angle}.png");
            if (File.Exists(f)) return f;
        }

        // 2. Caramel / Marron
        if (c.Contains("caramel") || c.Contains("marron") || c.Contains("chocolat") || h == "b06d40" || h == "582f17")
        {
            string f = Path.Combine(_assetsDir, $"mannequin_caramel_{angle}.png");
            if (File.Exists(f)) return f;
        }

        // 3. Vert Sauge (Front)
        if ((c.Contains("vert") || c.Contains("sauge") || h == "a3b18a") && angle == "front")
        {
            string f = Path.Combine(_assetsDir, "mannequin_vert_front.png");
            if (File.Exists(f)) return f;
        }

        // 4. Rose Poudré Signature Eya
        if (c.Contains("rose") || h == "f4b8c9" || h == "fbcfe8")
        {
            string f = Path.Combine(_assetsDir, $"mannequin_salon_{angle}.png");
            if (File.Exists(f)) return f;
        }

        return null;
    }

    private static string NormalizeHex(string? hex)
    {
        if (string.IsNullOrWhiteSpace(hex)) return "f4b8c9";
        return hex.Trim().TrimStart('#').ToLower();
    }

    private static bool TryParseHex(string hex, out byte r, out byte g, out byte b)
    {
        r = 0; g = 0; b = 0;
        string clean = NormalizeHex(hex);
        if (clean.Length != 6) return false;

        try
        {
            r = byte.Parse(clean.Substring(0, 2), NumberStyles.HexNumber);
            g = byte.Parse(clean.Substring(2, 2), NumberStyles.HexNumber);
            b = byte.Parse(clean.Substring(4, 2), NumberStyles.HexNumber);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
