using System.Text;
using CineVector.Domain.Entities;

namespace CineVector.Application.Embeddings;

/// <summary>Costruisce il documento testuale ottimizzato per l'embedding semantico di un film (Sezione 9 del progetto).
/// Richiede che le relazioni (Genres, Directors, Cast, Keywords) siano già caricate (es. tramite Include).</summary>
public static class EmbeddingTextBuilder
{
    private const int MaxCastMembers = 8;

    public static string Build(Movie movie)
    {
        var builder = new StringBuilder();

        AppendSection(builder, "Title", movie.Title);
        AppendSection(builder, "Original title", movie.OriginalTitle);
        AppendSection(builder, "Year", movie.Year?.ToString());
        AppendSection(builder, "Genres", Join(movie.Genres.Select(g => g.Genre!.Name)));
        AppendSection(builder, "Overview", movie.Overview);
        AppendSection(builder, "Cast", string.Join('\n', movie.Cast
            .OrderBy(c => c.BillingOrder)
            .Take(MaxCastMembers)
            .Select(c => c.Person!.Name)));
        AppendSection(builder, "Directors", string.Join('\n', movie.Directors.Select(d => d.Person!.Name)));
        AppendSection(builder, "Keywords", Join(movie.Keywords.Select(k => k.Keyword!.Name)));

        return builder.ToString().TrimEnd();
    }

    private static string Join(IEnumerable<string> values) => string.Join(", ", values);

    private static void AppendSection(StringBuilder builder, string label, string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        builder.Append(label).Append(":\n").Append(value).Append("\n\n");
    }
}
