using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext context, IConfiguration configuration)
    {
        // Ensure Database is created / migrated
        await context.Database.EnsureCreatedAsync();

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
    }
}
