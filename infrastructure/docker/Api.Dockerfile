FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY MovieCatalog.sln .
COPY src/MovieCatalog.Domain/MovieCatalog.Domain.csproj src/MovieCatalog.Domain/
COPY src/MovieCatalog.Application/MovieCatalog.Application.csproj src/MovieCatalog.Application/
COPY src/MovieCatalog.Infrastructure/MovieCatalog.Infrastructure.csproj src/MovieCatalog.Infrastructure/
COPY src/MovieCatalog.Contracts/MovieCatalog.Contracts.csproj src/MovieCatalog.Contracts/
COPY src/MovieCatalog.Search/MovieCatalog.Search.csproj src/MovieCatalog.Search/
COPY src/MovieCatalog.Api/MovieCatalog.Api.csproj src/MovieCatalog.Api/
COPY src/MovieCatalog.Worker/MovieCatalog.Worker.csproj src/MovieCatalog.Worker/
COPY tests/MovieCatalog.UnitTests/MovieCatalog.UnitTests.csproj tests/MovieCatalog.UnitTests/
COPY tests/MovieCatalog.IntegrationTests/MovieCatalog.IntegrationTests.csproj tests/MovieCatalog.IntegrationTests/
COPY tests/MovieCatalog.SearchTests/MovieCatalog.SearchTests.csproj tests/MovieCatalog.SearchTests/
RUN dotnet restore src/MovieCatalog.Api/MovieCatalog.Api.csproj

COPY src/ src/

RUN dotnet publish src/MovieCatalog.Api/MovieCatalog.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "MovieCatalog.Api.dll"]
