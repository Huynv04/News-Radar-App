using System.ComponentModel.DataAnnotations;

namespace NewsRadar.Application.Common.DTOs;

public class CreateCrawlerSourceDto
{
    [Required(ErrorMessage = "Source ID is required.")]
    [StringLength(50, MinimumLength = 3, ErrorMessage = "Source ID must be between 3 and 50 characters.")]
    public string Id { get; set; } = null!;

    [Required(ErrorMessage = "Source Name is required.")]
    [StringLength(100, ErrorMessage = "Source Name cannot exceed 100 characters.")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "RSS URL is required.")]
    [Url(ErrorMessage = "Invalid RSS URL format.")]
    public string RssUrl { get; set; } = null!;

    [Required(ErrorMessage = "Base URL is required.")]
    [Url(ErrorMessage = "Invalid Base URL format.")]
    public string BaseUrl { get; set; } = null!;

    [Range(1, 1440, ErrorMessage = "Scan interval must be between 1 and 1440 minutes.")]
    public int ScanIntervalMinutes { get; set; } = 10;

    [Required(ErrorMessage = "Selectors JSON configuration is required.")]
    public string Selectors { get; set; } = null!;
}