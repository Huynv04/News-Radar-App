using Microsoft.EntityFrameworkCore;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<CrawlerSource> CrawlerSources { get; }
    DbSet<Article> Articles { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}