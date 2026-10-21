using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCrawlerLogsAndCircuitBreaker : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "consecutive_failures",
                table: "crawler_sources",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "last_scanned_at",
                table: "crawler_sources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "crawler_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    crawler_source_id = table.Column<string>(type: "text", nullable: false),
                    scanned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    articles_found = table.Column<int>(type: "integer", nullable: false),
                    articles_inserted = table.Column<int>(type: "integer", nullable: false),
                    duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    is_success = table.Column<bool>(type: "boolean", nullable: false),
                    error_message = table.Column<string>(type: "text", nullable: true),
                    http_status_code = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_crawler_logs", x => x.id);
                    table.ForeignKey(
                        name: "fk_crawler_logs_crawler_sources_crawler_source_id",
                        column: x => x.crawler_source_id,
                        principalTable: "crawler_sources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_crawler_logs_crawler_source_id",
                table: "crawler_logs",
                column: "crawler_source_id");

            migrationBuilder.CreateIndex(
                name: "ix_crawler_logs_scanned_at",
                table: "crawler_logs",
                column: "scanned_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "crawler_logs");

            migrationBuilder.DropColumn(
                name: "consecutive_failures",
                table: "crawler_sources");

            migrationBuilder.DropColumn(
                name: "last_scanned_at",
                table: "crawler_sources");
        }
    }
}
