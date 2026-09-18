using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configuration des Contrôleurs et Sérialisation JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 2. Configuration de la Base de Données (PostgreSQL Neon ou SQLite de repli)
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL")
                       ?? builder.Configuration.GetConnectionString("DefaultConnection");

// Support du format URL Render/Neon (ex: postgres://user:password@host/dbname)
if (!string.IsNullOrWhiteSpace(connectionString) && (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://")))
{
    var uri = new Uri(connectionString);
    var userInfo = uri.UserInfo.Split(':');
    var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder
    {
        Host = uri.Host,
        Port = uri.Port > 0 ? uri.Port : 5432,
        Username = userInfo[0],
        Password = userInfo.Length > 1 ? userInfo[1] : "",
        Database = uri.AbsolutePath.TrimStart('/'),
        SslMode = Npgsql.SslMode.Require
    };
    connectionString = npgsqlBuilder.ToString();
}

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (!string.IsNullOrWhiteSpace(connectionString) && (connectionString.Contains("Host=") || connectionString.Contains("Server=")))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        // Repli local de développement ultra-rapide (offline)
        options.UseSqlite(connectionString ?? "Data Source=laboratoire.db");
    }
});

// 3. Configuration de l'Authentification JWT
var jwtKey = builder.Configuration["Jwt:Key"] ?? "LeLaboratoire_Ultra_Secret_Security_Key_2026_Algeria_Fayda!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "LeLaboratoire.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "LeLaboratoire.Clients";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// 4. Configuration CORS (Accès PWA Vercel + Localhost)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 5. Inversion de Contrôle & Services Métier
builder.Services.AddScoped<IFaydaCalculatorService, FaydaCalculatorService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddHttpClient<IMarketAiService, MarketAiService>();
builder.Services.AddHttpClient<IColorDetectionService, ColorDetectionService>();

var app = builder.Build();

// 6. Initialisation et Amorçage automatique de la BDD (2 Administrateurs)
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await DbSeeder.SeedAsync(db, app.Configuration);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Erreur lors de l'initialisation de la base de données.");
    }
}

// 7. Middlewares HTTP
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
