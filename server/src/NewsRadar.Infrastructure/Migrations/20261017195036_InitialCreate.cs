using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "crawler_sources",
                columns: table => new
                {
                    id = table.Column<string>(type: "text", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    rss_url = table.Column<string>(type: "text", nullable: false),
                    base_url = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    scan_interval_minutes = table.Column<int>(type: "integer", nullable: false),
                    selectors = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_crawler_sources", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "articles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    sapo = table.Column<string>(type: "text", nullable: true),
                    clean_body = table.Column<string>(type: "text", nullable: false),
                    source_url = table.Column<string>(type: "text", nullable: false),
                    source_id = table.Column<string>(type: "text", nullable: false),
                    author = table.Column<string>(type: "text", nullable: true),
                    published_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    hash_key = table.Column<string>(type: "text", nullable: false),
                    category = table.Column<string>(type: "text", nullable: false),
                    sentiment_score = table.Column<double>(type: "double precision", nullable: false),
                    sentiment_label = table.Column<string>(type: "text", nullable: false),
                    trend_score = table.Column<double>(type: "double precision", nullable: false),
                    is_manually_overridden = table.Column<bool>(type: "boolean", nullable: false),
                    pinned_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_articles", x => x.id);
                    table.ForeignKey(
                        name: "fk_articles_crawler_sources_source_id",
                        column: x => x.source_id,
                        principalTable: "crawler_sources",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_articles_hash_key",
                table: "articles",
                column: "hash_key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_articles_published_at_id",
                table: "articles",
                columns: new[] { "published_at", "id" });

            migrationBuilder.CreateIndex(
                name: "ix_articles_source_id",
                table: "articles",
                column: "source_id");

            migrationBuilder.CreateIndex(
                name: "ix_articles_source_url",
                table: "articles",
                column: "source_url",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "articles");

            migrationBuilder.DropTable(
                name: "crawler_sources");
        }
    }
}
