using Microsoft.EntityFrameworkCore.Migrations;
using NpgsqlTypes;

#nullable disable

namespace MovieCatalog.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextSearch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:unaccent", ",,")
                .Annotation("Npgsql:PostgresExtension:vector", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.AddColumn<NpgsqlTsVector>(
                name: "search_vector",
                table: "movies",
                type: "tsvector",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_movies_search_vector",
                table: "movies",
                column: "search_vector")
                .Annotation("Npgsql:IndexMethod", "GIN");

            // Il search_vector aggrega titolo/trama (pesi A/D) con generi, regia, cast e keyword (pesi B/C)
            // provenienti da tabelle correlate: non ottenibile con una colonna GENERATED di Postgres,
            // quindi viene ricalcolato via funzione+trigger ad ogni scrittura rilevante.
            migrationBuilder.Sql("""
                CREATE OR REPLACE FUNCTION refresh_movie_search_vector(p_movie_id integer) RETURNS void AS $$
                BEGIN
                    UPDATE movies m
                    SET search_vector =
                        setweight(to_tsvector('simple', unaccent(coalesce(m."Title", ''))), 'A') ||
                        setweight(to_tsvector('simple', unaccent(coalesce(m."OriginalTitle", ''))), 'A') ||
                        setweight(to_tsvector('simple', unaccent(coalesce((
                            SELECT string_agg(g."Name", ' ') FROM movie_genres mg
                            JOIN genres g ON g."Id" = mg."GenreId" WHERE mg."MovieId" = m."Id"
                        ), ''))), 'B') ||
                        setweight(to_tsvector('simple', unaccent(coalesce((
                            SELECT string_agg(p."Name", ' ') FROM movie_directors md
                            JOIN people p ON p."Id" = md."PersonId" WHERE md."MovieId" = m."Id"
                        ), ''))), 'B') ||
                        setweight(to_tsvector('simple', unaccent(coalesce((
                            SELECT string_agg(p."Name", ' ') FROM movie_cast mc
                            JOIN people p ON p."Id" = mc."PersonId" WHERE mc."MovieId" = m."Id"
                        ), ''))), 'C') ||
                        setweight(to_tsvector('simple', unaccent(coalesce((
                            SELECT string_agg(k."Name", ' ') FROM movie_keywords mk
                            JOIN keywords k ON k."Id" = mk."KeywordId" WHERE mk."MovieId" = m."Id"
                        ), ''))), 'C') ||
                        setweight(to_tsvector('simple', unaccent(coalesce(m."Overview", ''))), 'D')
                    WHERE m."Id" = p_movie_id;
                END;
                $$ LANGUAGE plpgsql;

                CREATE OR REPLACE FUNCTION trg_movies_search_vector() RETURNS trigger AS $$
                BEGIN
                    PERFORM refresh_movie_search_vector(NEW."Id");
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER movies_search_vector_trigger
                AFTER INSERT OR UPDATE OF "Title", "OriginalTitle", "Overview" ON movies
                FOR EACH ROW EXECUTE FUNCTION trg_movies_search_vector();

                CREATE OR REPLACE FUNCTION trg_movie_relation_search_vector() RETURNS trigger AS $$
                BEGIN
                    IF TG_OP = 'DELETE' THEN
                        PERFORM refresh_movie_search_vector(OLD."MovieId");
                        RETURN OLD;
                    ELSE
                        PERFORM refresh_movie_search_vector(NEW."MovieId");
                        RETURN NEW;
                    END IF;
                END;
                $$ LANGUAGE plpgsql;

                CREATE TRIGGER movie_genres_search_vector_trigger
                AFTER INSERT OR UPDATE OR DELETE ON movie_genres
                FOR EACH ROW EXECUTE FUNCTION trg_movie_relation_search_vector();

                CREATE TRIGGER movie_directors_search_vector_trigger
                AFTER INSERT OR UPDATE OR DELETE ON movie_directors
                FOR EACH ROW EXECUTE FUNCTION trg_movie_relation_search_vector();

                CREATE TRIGGER movie_cast_search_vector_trigger
                AFTER INSERT OR UPDATE OR DELETE ON movie_cast
                FOR EACH ROW EXECUTE FUNCTION trg_movie_relation_search_vector();

                CREATE TRIGGER movie_keywords_search_vector_trigger
                AFTER INSERT OR UPDATE OR DELETE ON movie_keywords
                FOR EACH ROW EXECUTE FUNCTION trg_movie_relation_search_vector();
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TRIGGER IF EXISTS movie_keywords_search_vector_trigger ON movie_keywords;
                DROP TRIGGER IF EXISTS movie_cast_search_vector_trigger ON movie_cast;
                DROP TRIGGER IF EXISTS movie_directors_search_vector_trigger ON movie_directors;
                DROP TRIGGER IF EXISTS movie_genres_search_vector_trigger ON movie_genres;
                DROP FUNCTION IF EXISTS trg_movie_relation_search_vector();
                DROP TRIGGER IF EXISTS movies_search_vector_trigger ON movies;
                DROP FUNCTION IF EXISTS trg_movies_search_vector();
                DROP FUNCTION IF EXISTS refresh_movie_search_vector(integer);
                """);

            migrationBuilder.DropIndex(
                name: "ix_movies_search_vector",
                table: "movies");

            migrationBuilder.DropColumn(
                name: "search_vector",
                table: "movies");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:vector", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:unaccent", ",,")
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");
        }
    }
}
