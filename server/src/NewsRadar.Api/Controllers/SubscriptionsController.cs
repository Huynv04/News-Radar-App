using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NewsRadar.Application.Common.DTOs;
using NewsRadar.Application.Common.Interfaces;

namespace NewsRadar.Api.Controllers;

[ApiController]
[Route("api/subscriptions")]
[Authorize]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _subscriptionService;

    public SubscriptionsController(ISubscriptionService subscriptionService)
    {
        _subscriptionService = subscriptionService;
    }

    /// <summary>Lấy danh sách subscriptions của user hiện tại</summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<SubscriptionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSubscriptions(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var subscriptions = await _subscriptionService.GetUserSubscriptionsAsync(userId, cancellationToken);
        return Ok(subscriptions);
    }

    /// <summary>Tạo subscription mới theo từ khóa/danh mục</summary>
    [HttpPost]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateSubscription([FromBody] CreateSubscriptionRequest request, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var subscription = await _subscriptionService.CreateSubscriptionAsync(userId, request, cancellationToken);
        return CreatedAtAction(nameof(GetSubscriptions), null, subscription);
    }

    /// <summary>Cập nhật subscription (thay đổi keyword, channel, bật/tắt)</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(SubscriptionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateSubscription(
        [FromRoute] Guid id,
        [FromBody] UpdateSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var subscription = await _subscriptionService.UpdateSubscriptionAsync(userId, id, request, cancellationToken);
        return Ok(subscription);
    }

    /// <summary>Xóa subscription</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteSubscription([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await _subscriptionService.DeleteSubscriptionAsync(userId, id, cancellationToken);
        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier)
               ?? User.FindFirstValue("sub")
               ?? throw new UnauthorizedAccessException("User ID not found in token.");
        return Guid.Parse(sub);
    }
}
