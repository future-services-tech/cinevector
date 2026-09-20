FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY CineVector.slnx .
COPY src/CineVector.Domain/CineVector.Domain.csproj src/CineVector.Domain/
COPY src/CineVector.Application/CineVector.Application.csproj src/CineVector.Application/
COPY src/CineVector.Infrastructure/CineVector.Infrastructure.csproj src/CineVector.Infrastructure/
COPY src/CineVector.Contracts/CineVector.Contracts.csproj src/CineVector.Contracts/
COPY src/CineVector.Search/CineVector.Search.csproj src/CineVector.Search/
COPY src/CineVector.Api/CineVector.Api.csproj src/CineVector.Api/
COPY src/CineVector.Worker/CineVector.Worker.csproj src/CineVector.Worker/
COPY tests/CineVector.UnitTests/CineVector.UnitTests.csproj tests/CineVector.UnitTests/
COPY tests/CineVector.IntegrationTests/CineVector.IntegrationTests.csproj tests/CineVector.IntegrationTests/
COPY tests/CineVector.SearchTests/CineVector.SearchTests.csproj tests/CineVector.SearchTests/
RUN dotnet restore src/CineVector.Api/CineVector.Api.csproj

COPY src/ src/

RUN dotnet publish src/CineVector.Api/CineVector.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# curl serve solo all'healthcheck del compose
RUN apt-get update     && apt-get install -y --no-install-recommends curl     && rm -rf /var/lib/apt/lists/*

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Utente non privilegiato predefinito delle immagini .NET (porta 8080 > 1024, nessun bisogno di root)
USER $APP_UID

ENTRYPOINT ["dotnet", "CineVector.Api.dll"]
