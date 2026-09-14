namespace CineVector.Search.NaturalLanguage;

/// <summary>Trasforma una query in linguaggio naturale in un intento di ricerca strutturato. La prima implementazione
/// è rule-based (regex/dizionari); l'interfaccia è pensata per essere sostituita in futuro da un parser basato su LLM
/// senza toccare il resto della pipeline di ricerca.</summary>
public interface ISearchIntentParser
{
    SearchIntent Parse(string naturalLanguageQuery);
}
