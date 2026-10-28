using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NewsRadar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAuthorImageClusteringAndGitHubOAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "author",
                table: "articles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "cluster_count",
                table: "articles",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<Guid>(
                name: "cluster_id",
                table: "articles",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "articles",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "git_hub_id",
                table: "app_users",
                type: "character varying(256)",
                maxLength: 256,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_articles_cluster_id",
                table: "articles",
                column: "cluster_id");

            migrationBuilder.CreateIndex(
                name: "ix_app_users_git_hub_id",
                table: "app_users",
                column: "git_hub_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_articles_cluster_id",
                table: "articles");

            migrationBuilder.DropIndex(
                name: "ix_app_users_git_hub_id",
                table: "app_users");

            migrationBuilder.DropColumn(
                name: "author",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "cluster_count",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "cluster_id",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "articles");

            migrationBuilder.DropColumn(
                name: "git_hub_id",
                table: "app_users");
        }
    }
}
