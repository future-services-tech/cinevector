using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CineVector.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPersonProfileAndWikipediaUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ProfileUrl",
                table: "people",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "WikipediaUrl",
                table: "people",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProfileUrl",
                table: "people");

            migrationBuilder.DropColumn(
                name: "WikipediaUrl",
                table: "people");
        }
    }
}
