using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CineVector.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSettingsTheme : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Theme",
                table: "app_settings",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "app_settings",
                keyColumn: "Id",
                keyValue: 1,
                column: "Theme",
                value: "scuro");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Theme",
                table: "app_settings");
        }
    }
}
