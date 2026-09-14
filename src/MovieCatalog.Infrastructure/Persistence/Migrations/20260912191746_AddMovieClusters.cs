using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using Pgvector;

#nullable disable

namespace MovieCatalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieClusters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "ClusterCoordX",
                table: "movies",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "ClusterCoordY",
                table: "movies",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<float>(
                name: "ClusterCoordZ",
                table: "movies",
                type: "real",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ClusterId",
                table: "movies",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "movie_clusters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    MemberCount = table.Column<int>(type: "integer", nullable: false),
                    Centroid = table.Column<Vector>(type: "vector(384)", nullable: false),
                    CoordX = table.Column<float>(type: "real", nullable: false),
                    CoordY = table.Column<float>(type: "real", nullable: false),
                    CoordZ = table.Column<float>(type: "real", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movie_clusters", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_movies_ClusterId",
                table: "movies",
                column: "ClusterId");

            migrationBuilder.AddForeignKey(
                name: "FK_movies_movie_clusters_ClusterId",
                table: "movies",
                column: "ClusterId",
                principalTable: "movie_clusters",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_movies_movie_clusters_ClusterId",
                table: "movies");

            migrationBuilder.DropTable(
                name: "movie_clusters");

            migrationBuilder.DropIndex(
                name: "IX_movies_ClusterId",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "ClusterCoordX",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "ClusterCoordY",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "ClusterCoordZ",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "ClusterId",
                table: "movies");
        }
    }
}
