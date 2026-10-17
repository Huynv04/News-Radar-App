using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IApplicationDbContext _context;

    public HealthController(IApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("db-check")]
    public async Task<IActionResult> CheckDbConnection()
    {
        try
        {
            var sourceCount = await _context.CrawlerSources.CountAsync();
            return Ok(new
            {
                status = "Success",
                message = "Kết nối PostgreSQL thành công!",
                totalSources = sourceCount
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                status = "Error",
                message = "Lỗi kết nối PostgreSQL: " + ex.Message
            });
        }
    }
}