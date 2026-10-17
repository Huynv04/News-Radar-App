using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using NewsRadar.Application.Common.Interfaces;
using NewsRadar.Infrastructure.Persistence;
using NewsRadar.Infrastructure.Services;

namespace NewsRadar.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString)
                   .UseSnakeCaseNamingConvention());

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<ApplicationDbContext>());

        // Register CrawlerSourceService
        services.AddScoped<ICrawlerSourceService, CrawlerSourceService>();
        return services;
    }
}