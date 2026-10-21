using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryToArticle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "category",
                table: "articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "Thời sự");

            migrationBuilder.CreateIndex(
                name: "ix_articles_category",
                table: "articles",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "ix_articles_published_at",
                table: "articles",
                column: "published_at");

            migrationBuilder.CreateIndex(
                name: "ix_articles_trend_score",
                table: "articles",
                column: "trend_score");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_articles_category",
                table: "articles");

            migrationBuilder.DropIndex(
                name: "ix_articles_published_at",
                table: "articles");

            migrationBuilder.DropIndex(
                name: "ix_articles_trend_score",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "category",
                table: "articles");
        }
    }
}
