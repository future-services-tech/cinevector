using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MovieCatalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCrawlJobQueryCriteria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Query",
                table: "crawl_jobs",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QueryMode",
                table: "crawl_jobs",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Query",
                table: "crawl_jobs");

            migrationBuilder.DropColumn(
                name: "QueryMode",
                table: "crawl_jobs");
        }
    }
}
