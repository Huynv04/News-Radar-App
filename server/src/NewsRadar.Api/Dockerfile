# Stage 1: Runtime base image cho .NET 10
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
WORKDIR /app
EXPOSE 8080

# Stage 2: SDK image để build mã nguồn
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy các file project (.csproj) để restore dependencies
COPY ["src/NewsRadar.Api/NewsRadar.Api.csproj", "src/NewsRadar.Api/"]
COPY ["src/NewsRadar.Application/NewsRadar.Application.csproj", "src/NewsRadar.Application/"]
COPY ["src/NewsRadar.Domain/NewsRadar.Domain.csproj", "src/NewsRadar.Domain/"]
COPY ["src/NewsRadar.Infrastructure/NewsRadar.Infrastructure.csproj", "src/NewsRadar.Infrastructure/"]

RUN dotnet restore "src/NewsRadar.Api/NewsRadar.Api.csproj"

# Copy toàn bộ mã nguồn và biên dịch
COPY . .
WORKDIR "/src/src/NewsRadar.Api"
RUN dotnet build "NewsRadar.Api.csproj" -c Release -o /app/build

# Stage 3: Publish ứng dụng
FROM build AS publish
RUN dotnet publish "NewsRadar.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 4: Chạy ứng dụng từ bản publish
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "NewsRadar.Api.dll"]