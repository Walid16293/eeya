using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LeLaboratoire.Api.Data;
using LeLaboratoire.Api.DTOs;
using LeLaboratoire.Api.Models;

namespace LeLaboratoire.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(AppDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetAll()
    {
        var products = await _context.Products
            .Include(p => p.Tests)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new ProductDto(
                p.Id,
                p.Name,
                p.Category,
                p.ImageUrl,
                p.Specifications,
                p.BuyPrice,
                p.TargetSellPrice,
                p.CreatedAt,
                p.Tests.Count,
                p.Tests.Any(t => t.Status == "Active")
            ))
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ProductDto>> GetById(Guid id)
    {
        var p = await _context.Products
            .Include(x => x.Tests)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null) return NotFound();

        return Ok(new ProductDto(
            p.Id,
            p.Name,
            p.Category,
            p.ImageUrl,
            p.Specifications,
            p.BuyPrice,
            p.TargetSellPrice,
            p.CreatedAt,
            p.Tests.Count,
            p.Tests.Any(t => t.Status == "Active")
        ));
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create([FromBody] CreateProductDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            Category = string.IsNullOrWhiteSpace(dto.Category) ? "Général" : dto.Category.Trim(),
            ImageUrl = dto.ImageUrl?.Trim() ?? string.Empty,
            Specifications = string.IsNullOrWhiteSpace(dto.Specifications) ? "{}" : dto.Specifications,
            BuyPrice = dto.BuyPrice,
            TargetSellPrice = dto.TargetSellPrice,
            CreatedAt = DateTime.UtcNow
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.ImageUrl,
            product.Specifications,
            product.BuyPrice,
            product.TargetSellPrice,
            product.CreatedAt,
            0,
            false
        ));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Update(Guid id, [FromBody] UpdateProductDto dto)
    {
        var product = await _context.Products
            .Include(p => p.Tests)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null) return NotFound();

        if (dto.Name != null) product.Name = dto.Name.Trim();
        if (dto.Category != null) product.Category = dto.Category.Trim();
        if (dto.ImageUrl != null) product.ImageUrl = dto.ImageUrl.Trim();
        if (dto.Specifications != null) product.Specifications = dto.Specifications;
        if (dto.BuyPrice.HasValue) product.BuyPrice = dto.BuyPrice.Value;
        if (dto.TargetSellPrice.HasValue) product.TargetSellPrice = dto.TargetSellPrice.Value;

        await _context.SaveChangesAsync();

        return Ok(new ProductDto(
            product.Id,
            product.Name,
            product.Category,
            product.ImageUrl,
            product.Specifications,
            product.BuyPrice,
            product.TargetSellPrice,
            product.CreatedAt,
            product.Tests.Count,
            product.Tests.Any(t => t.Status == "Active")
        ));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
