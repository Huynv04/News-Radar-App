using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNlpColumnsToArticle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "content_hash",
                table: "articles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "sentiment_label",
                table: "articles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<double>(
                name: "sentiment_score",
                table: "articles",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "trend_score",
                table: "articles",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "content_hash",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "sentiment_label",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "sentiment_score",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "trend_score",
                table: "articles");
        }
    }
}
