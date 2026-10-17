using Microsoft.EntityFrameworkCore;
using NewsRadar.Infrastructure;
using NewsRadar.Infrastructure.Persistence;
var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Đăng ký Infrastructure Services (bao gồm PostgreSQL DbContext)
builder.Services.AddInfrastructureServices(builder.Configuration);
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Tự động kiểm tra và áp dụng Migration vào Database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await dbContext.Database.MigrateAsync();
}
app.Run();
// Thêm dòng này ở cuối cùng của file Program.cs
public partial class Program { }