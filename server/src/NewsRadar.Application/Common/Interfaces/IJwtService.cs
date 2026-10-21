using System.Security.Claims;
using NewsRadar.Domain.Entities;

namespace NewsRadar.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(AppUser user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateExpiredAccessToken(string accessToken);
}
