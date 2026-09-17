using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using CineVector.Application.Settings;
using CineVector.Contracts.Settings;

namespace CineVector.Api.Controllers;

/// <summary>Preferenze UI globali (nessun concetto di utente/autenticazione ancora esistente): il frontend le
/// legge all'avvio e le salva ad ogni modifica, al posto del vecchio localStorage per-browser.</summary>
[ApiController]
[Route("api/settings")]
public class SettingsController(AppSettingsService settingsService, IValidator<UpdateAppSettingsRequest> validator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AppSettingsDto>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AppSettingsDto>> Get(CancellationToken ct) =>
        Ok(await settingsService.GetAsync(ct));

    [HttpPut]
    [ProducesResponseType<AppSettingsDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AppSettingsDto>> Update(UpdateAppSettingsRequest request, CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            return ValidationProblem(new ValidationProblemDetails(validation.ToDictionary()));
        }

        return Ok(await settingsService.UpdateAsync(request, ct));
    }
}
