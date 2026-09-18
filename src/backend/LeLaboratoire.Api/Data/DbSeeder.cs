using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, IConfiguration configuration)
    {
        // Ensure Database is created / migrated
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        if (!await context.Users.AnyAsync())
        {
            var admin1User = configuration["AdminSeed:Admin1:Username"] ?? "admin1";
            var admin1Pass = configuration["AdminSeed:Admin1:Password"] ?? "Laboratoire1@2026";
            var admin1Name = configuration["AdminSeed:Admin1:FullName"] ?? "Associé 1 (Terrain)";

            var admin2User = configuration["AdminSeed:Admin2:Username"] ?? "admin2";
            var admin2Pass = configuration["AdminSeed:Admin2:Password"] ?? "Laboratoire2@2026";
            var admin2Name = configuration["AdminSeed:Admin2:FullName"] ?? "Associé 2 (Bureau)";

            var admin1 = new User
            {
                Id = Guid.NewGuid(),
                Username = admin1User,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(admin1Pass),
                FullName = admin1Name,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            var admin2 = new User
            {
                Id = Guid.NewGuid(),
                Username = admin2User,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(admin2Pass),
                FullName = admin2Name,
                Role = "Admin",
                CreatedAt = DateTime.UtcNow
            };

            await context.Users.AddRangeAsync(admin1, admin2);
            await context.SaveChangesAsync();
        }

        if (!await context.Products.AnyAsync())
        {
            var initialProduct = new Product
            {
                Id = Guid.NewGuid(),
                Name = "Ensemble Pyjama Côtelé & Pantalon Carreaux",
                Category = "Pyjamas",
                ImageUrl = "/mannequin/mannequin_salon_front.png",
                BuyPrice = 1200m,
                TargetSellPrice = 2900m,
                Specifications = "{\"tailles\": [\"S\", \"M\", \"L\", \"XL\"], \"couleurs\": [\"Rose Poudré & Carreaux\", \"Marron Caramel & Carreaux\"], \"images\": [\"/images/photo_2026-09-18_17-38-32.jpg\", \"/images/photo_2026-09-18_17-38-35.jpg\"], \"variants\": [{\"id\": \"var-rose\", \"color\": \"Rose Poudré & Carreaux\", \"hex\": \"#f4b8c9\", \"originalImage\": \"/images/photo_2026-09-18_17-38-32.jpg\", \"mannequinFront\": \"/mannequin/mannequin_salon_front.png\", \"mannequinSide\": \"/mannequin/mannequin_salon_side.png\", \"mannequinBack\": \"/mannequin/mannequin_salon_back.png\", \"stock\": 8}, {\"id\": \"var-caramel\", \"color\": \"Marron Caramel & Carreaux\", \"hex\": \"#b06d40\", \"originalImage\": \"/images/photo_2026-09-18_17-38-35.jpg\", \"mannequinFront\": \"/mannequin/mannequin_caramel_front.png\", \"mannequinSide\": \"/mannequin/mannequin_salon_side.png\", \"mannequinBack\": \"/mannequin/mannequin_salon_back.png\", \"stock\": 8}], \"mannequinViews\": {\"front\": \"/mannequin/mannequin_salon_front.png\", \"side\": \"/mannequin/mannequin_salon_side.png\", \"back\": \"/mannequin/mannequin_salon_back.png\"}}",
                CreatedAt = DateTime.UtcNow
            };

            await context.Products.AddAsync(initialProduct);
            await context.SaveChangesAsync();
        }
    }
}
