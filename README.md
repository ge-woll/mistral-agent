# Mistral Agent Next.js

Eine kleine Next.js-App, die eine Chatoberflaeche fuer einen Mistral-Agenten bereitstellt.

Der Agent ist standardmaessig auf diese ID vorkonfiguriert:

```txt
ag_019f02ee1e88722fb6a1043abada152b
```

## Lokal starten

```bash
npm install
cp .env.example .env
npm run dev
```

In `.env` muss mindestens `MISTRAL_API_KEY` gesetzt sein.

## GitHub

1. Neues GitHub-Repository erstellen.
2. Diese Projektdateien committen und nach `main` pushen.
3. Die GitHub Action baut die Next.js-App bei Pushes und Pull Requests.

## Coolify

1. In Coolify ein neues Projekt aus dem GitHub-Repository erstellen.
2. Empfohlen: Als Build-Variante Dockerfile verwenden. Nixpacks ist ebenfalls vorkonfiguriert.
3. Environment Variables setzen:

```txt
MISTRAL_API_KEY=dein_mistral_api_key
MISTRAL_AGENT_ID=ag_019f02ee1e88722fb6a1043abada152b
```

4. Port `3000` verwenden und deployen.

Falls Coolify mit Nixpacks baut, achtet `nixpacks.toml` darauf, dass Node 22 verwendet wird.

## API

Die Route `POST /api/agent` nimmt JSON entgegen:

```json
{
  "message": "Hallo Agent"
}
```

Die Serverroute ruft Mistral mit `agent_id` und `inputs` auf. Der API-Key bleibt dadurch serverseitig und wird nicht im Browser sichtbar.
