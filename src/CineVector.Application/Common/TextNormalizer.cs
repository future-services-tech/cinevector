using System.Globalization;
using System.Text;

namespace CineVector.Application.Common;

/// <summary>Normalizza stringhe (nomi persona, generi, keyword) per confronti/deduplicazione indipendenti da maiuscole e accenti.</summary>
public static class TextNormalizer
{
    public static string Normalize(string value)
    {
        var decomposed = value.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(decomposed.Length);

        foreach (var c in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            {
                builder.Append(c);
            }
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }
}
