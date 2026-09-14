using System.Globalization;
using System.Text.RegularExpressions;

namespace MovieCatalog.Search.NaturalLanguage;

/// <summary>Prima implementazione di <see cref="ISearchIntentParser"/>: regex/dizionari su frasi in italiano.
/// Riconosce e rimuove dal testo, in ordine, intervalli di anni, soglie di rating, nazione, regista, attore e
/// generi; ciò che resta diventa la query testuale (semantica) residua. Non è un parser linguistico generale:
/// copre i pattern degli esempi del progetto e va sostituito/affiancato da un parser LLM quando servirà più copertura.</summary>
public class RuleBasedSearchIntentParser : ISearchIntentParser
{
    private static readonly Regex YearRangePattern = new(@"\bdal\s+(\d{4})\s+al\s+(\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex YearBetweenPattern = new(@"\btra\s+(?:il\s+)?(\d{4})\s+e\s+(?:il\s+)?(\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex YearAfterPattern = new(@"\bdopo\s+(?:il\s+)?(\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex YearBeforePattern = new(@"\bprima\s+del\s+(\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex YearExactPattern = new(@"\bdel\s+(\d{4})\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex RatingPattern = new(
        @"\b(?:valutazione|rating|voto)?\s*(?:superiore\s+a|sopra(?:\s+il)?|maggiore\s+di|oltre)\s+(\d+(?:[.,]\d+)?)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex CountryPattern = new(@"\bambientat[oi]\s+in\s+([A-Za-zÀ-ÿ]+)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex DirectorPattern = new(@"\b(?:diretto\s+da|regia\s+di)\s+([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)+)", RegexOptions.Compiled);
    private static readonly Regex ActorPattern = new(@"\bcon\s+([A-ZÀ-Ý][a-zà-ÿ]+(?:\s+[A-ZÀ-Ý][a-zà-ÿ]+)+)", RegexOptions.Compiled);

    private static readonly Regex ResidualStopwords = new(
        @"\b(film|di|con|dal|al|tra|e|il|la|un|una|superiore|a|sopra|maggiore|oltre)\b",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly (Regex Pattern, string[] Genres)[] GenreMap = BuildGenreMap();

    public SearchIntent Parse(string naturalLanguageQuery)
    {
        var intent = new SearchIntent();
        var text = naturalLanguageQuery;

        text = Extract(YearRangePattern, text, m =>
        {
            intent.YearFrom = int.Parse(m.Groups[1].Value);
            intent.YearTo = int.Parse(m.Groups[2].Value);
        });

        text = Extract(YearBetweenPattern, text, m =>
        {
            intent.YearFrom = int.Parse(m.Groups[1].Value);
            intent.YearTo = int.Parse(m.Groups[2].Value);
        });

        text = Extract(YearAfterPattern, text, m => intent.YearFrom = int.Parse(m.Groups[1].Value));
        text = Extract(YearBeforePattern, text, m => intent.YearTo = int.Parse(m.Groups[1].Value));

        if (intent.YearFrom is null && intent.YearTo is null)
        {
            text = Extract(YearExactPattern, text, m =>
            {
                var year = int.Parse(m.Groups[1].Value);
                intent.YearFrom = year;
                intent.YearTo = year;
            });
        }

        text = Extract(RatingPattern, text, m =>
            intent.RatingMin = double.Parse(m.Groups[1].Value.Replace(',', '.'), CultureInfo.InvariantCulture));

        text = Extract(CountryPattern, text, m => intent.Country = m.Groups[1].Value);
        text = Extract(DirectorPattern, text, m => intent.Directors.Add(m.Groups[1].Value.Trim()));
        text = Extract(ActorPattern, text, m => intent.Actors.Add(m.Groups[1].Value.Trim()));

        foreach (var (pattern, genres) in GenreMap)
        {
            if (pattern.IsMatch(text))
            {
                intent.Genres.AddRange(genres);
                text = pattern.Replace(text, " ");
            }
        }

        text = ResidualStopwords.Replace(text, " ");
        text = Regex.Replace(text, @"\s+", " ").Trim();

        intent.TextQuery = string.IsNullOrWhiteSpace(text) ? null : text;
        intent.Semantic = intent.TextQuery is not null;

        return intent;
    }

    private static string Extract(Regex pattern, string text, Action<Match> onMatch)
    {
        var match = pattern.Match(text);
        if (!match.Success)
        {
            return text;
        }

        onMatch(match);
        return pattern.Replace(text, " ", 1);
    }

    private static (Regex Pattern, string[] Genres)[] BuildGenreMap() =>
    [
        (Compile("fantascienza|sci-?fi"), ["Fantascienza", "Science Fiction"]),
        (Compile("azione"), ["Azione", "Action"]),
        (Compile("commed"), ["Commedia", "Comedy"]),
        (Compile("dramma|drammatic"), ["Dramma", "Drama"]),
        (Compile("thriller"), ["Thriller"]),
        (Compile("horror"), ["Horror"]),
        (Compile("romantic|amore"), ["Romance"]),
        (Compile("crime|poliziesc"), ["Crime"]),
        (Compile("guerra"), ["War"]),
        (Compile("storic"), ["History"]),
        (Compile("fantasy"), ["Fantasy"]),
        (Compile("animazione|cartoni"), ["Animazione", "Animation"]),
        (Compile("avventura"), ["Avventura", "Adventure"]),
        (Compile("famiglia"), ["Famiglia", "Family"]),
        (Compile("musical"), ["Music"]),
        (Compile("document"), ["Documentary"])
    ];

    private static Regex Compile(string alternation) =>
        new($@"\b({alternation})\w*\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
}
