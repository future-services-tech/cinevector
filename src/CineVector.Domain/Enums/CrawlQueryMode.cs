namespace CineVector.Domain.Enums;

/// <summary>Criterio di scoperta usato da un CrawlJob. Popular è il comportamento storico (film più popolari,
/// nessun filtro); gli altri restringono la ricerca a un titolo o a una persona (con un ruolo specifico).</summary>
public enum CrawlQueryMode
{
    Popular,
    Title,
    Actor,
    Director,
    Producer
}
