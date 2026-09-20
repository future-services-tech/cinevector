using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace CineVector.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAppSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "app_settings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AnimationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CardHoverEffects = table.Column<bool>(type: "boolean", nullable: false),
                    CarouselEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    CarouselSpeedSec = table.Column<int>(type: "integer", nullable: false),
                    SphereDensity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    HaloIntensity = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ClusterPanelDefaultOpen = table.Column<bool>(type: "boolean", nullable: false),
                    NotificationsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    SpotifyAutoMatchEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    DefaultPlayerVolume = table.Column<int>(type: "integer", nullable: false),
                    PosterSphereZoom = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    PosterSpherePageSize = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_app_settings", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "app_settings",
                columns: new[] { "Id", "AnimationsEnabled", "CardHoverEffects", "CarouselEnabled", "CarouselSpeedSec", "ClusterPanelDefaultOpen", "DefaultPlayerVolume", "HaloIntensity", "NotificationsEnabled", "PosterSpherePageSize", "PosterSphereZoom", "SphereDensity", "SpotifyAutoMatchEnabled" },
                values: new object[] { 1, true, true, true, 65, false, 80, "sottile", true, 30, "normale", "leggera", true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "app_settings");
        }
    }
}
