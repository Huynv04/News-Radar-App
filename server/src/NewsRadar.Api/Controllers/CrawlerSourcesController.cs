using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace NewsRadar.Api.Controllers;
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/crawler-sources")]
public class CrawlerSourcesController : ControllerBase
{
    private readonly ICrawlerSourceService _crawlerSourceService;

    public CrawlerSourcesController(ICrawlerSourceService crawlerSourceService)
    {
        _crawlerSourceService = crawlerSourceService;
    }

[AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CrawlerSourceDto>>> GetAll(CancellationToken cancellationToken)
    {
        var sources = await _crawlerSourceService.GetAllSourcesAsync(cancellationToken);
        return Ok(sources);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CrawlerSourceDto>> GetById(string id, CancellationToken cancellationToken)
    {
        var source = await _crawlerSourceService.GetSourceByIdAsync(id, cancellationToken);
        if (source == null)
        {
            return NotFound(new { message = $"Crawler source with ID '{id}' was not found." });
        }
        return Ok(source);
    }

    [HttpPost]
    public async Task<ActionResult<CrawlerSourceDto>> Create([FromBody] CreateCrawlerSourceDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var createdSource = await _crawlerSourceService.CreateSourceAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = createdSource.Id }, createdSource);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<CrawlerSourceDto>> Update(string id, [FromBody] UpdateCrawlerSourceDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var updatedSource = await _crawlerSourceService.UpdateSourceAsync(id, dto, cancellationToken);
            return Ok(updatedSource);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, CancellationToken cancellationToken)
    {
        var success = await _crawlerSourceService.DeleteSourceAsync(id, cancellationToken);
        if (!success)
        {
            return NotFound(new { message = $"Crawler source with ID '{id}' was not found." });
        }
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleStatus(string id, [FromQuery] bool isActive, CancellationToken cancellationToken)
    {
        try
        {
            await _crawlerSourceService.ToggleSourceStatusAsync(id, isActive, cancellationToken);
            return Ok(new { message = $"Crawler source status updated to {(isActive ? "Active" : "Inactive")}." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    [HttpGet("logs")]
    public async Task<ActionResult<IEnumerable<CrawlerLogDto>>> GetLogs(
        [FromQuery] string? sourceId,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        var logs = await _crawlerSourceService.GetLogsAsync(sourceId, limit, cancellationToken);
        return Ok(logs);
    }

    [HttpGet("logs/hourly-stats")]
    public async Task<ActionResult<IEnumerable<CrawlerHourlyStatDto>>> GetHourlyStats(
        [FromQuery] string? sourceId,
        CancellationToken cancellationToken = default)
    {
        var stats = await _crawlerSourceService.GetHourlyStatsAsync(sourceId, cancellationToken);
        return Ok(stats);
    }
}