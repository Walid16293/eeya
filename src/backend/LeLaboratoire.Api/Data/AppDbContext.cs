using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductTest> ProductTests => Set<ProductTest>();
    public DbSet<TestDailyMetric> TestDailyMetrics => Set<TestDailyMetric>();
    public DbSet<AiMarketInsight> AiMarketInsights => Set<AiMarketInsight>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User constraints
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        // Product constraints & JSONB support
        modelBuilder.Entity<Product>()
            .Property(p => p.Specifications)
            .HasColumnType("jsonb");

        // AiMarketInsight JSONB
        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.RawJsonData)
            .HasColumnType("jsonb");

        // Decimal precision configurations
        modelBuilder.Entity<Product>()
            .Property(p => p.BuyPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Product>()
            .Property(p => p.TargetSellPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductTest>()
            .Property(t => t.RasLmal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductTest>()
            .Property(t => t.AdsBudgetTotal)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductTest>()
            .Property(t => t.TicketBureauFee)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductTest>()
            .Property(t => t.SellingPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ProductTest>()
            .Property(t => t.AIRecommendedPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<TestDailyMetric>()
            .Property(m => m.AdsSpent)
            .HasPrecision(18, 2);

        modelBuilder.Entity<TestDailyMetric>()
            .Property(m => m.TotalRevenue)
            .HasPrecision(18, 2);

        modelBuilder.Entity<TestDailyMetric>()
            .Property(m => m.NetFayda)
            .HasPrecision(18, 2);

        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.MinObservedPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.MaxObservedPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.AveragePrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.RecommendedCeilingPrice)
            .HasPrecision(18, 2);

        modelBuilder.Entity<AiMarketInsight>()
            .Property(a => a.PsychologicalPrice)
            .HasPrecision(18, 2);
    }
}
