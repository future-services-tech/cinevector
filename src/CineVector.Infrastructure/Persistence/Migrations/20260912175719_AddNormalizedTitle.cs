using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CineVector.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddNormalizedTitle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NormalizedTitle",
                table: "movies",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            // Backfill approssimativo per le righe esistenti (solo minuscolo, senza rimozione accenti):
            // sufficiente perché il valore reale viene ricalcolato da TextNormalizer alla prossima scrittura del film.
            migrationBuilder.Sql("UPDATE movies SET \"NormalizedTitle\" = lower(\"Title\");");

            migrationBuilder.CreateIndex(
                name: "IX_movies_NormalizedTitle_Year",
                table: "movies",
                columns: new[] { "NormalizedTitle", "Year" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_movies_NormalizedTitle_Year",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "NormalizedTitle",
                table: "movies");
        }
    }
}
