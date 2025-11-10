# Architecture

This document replaces the placeholder docs/architecture.png with a editable Mermaid diagram that documents the demo app architecture for alloy-connectivity-demo. It includes components, responsibilities and a sequence overview.

```mermaid
flowchart LR
  Developer["Developer / Operator"]
  DemoApp["Demo App\n(Node.js / TypeScript)"]
  Config["Config\n(.env)"]
  APIClient["Alloy API Client\n(api/client.ts)"]
  Server["HTTP Server\n(Express / server.ts)"]
  Webhook["Webhook Handler\n(verify signature, process events)"]
  Examples["Example Flows / CLI\n(src/examples)"]
  Utils["Utilities\n(logger, errors, retry)"]
  DB["Optional Database\n(Postgres / DynamoDB)"]
  Queue["Optional Queue\n(SQS / RabbitMQ)"]
  Observability["Observability\n(Logs / Metrics)"]
  Alloy["Alloy External API\n(Sandbox / Production)"]

  Developer -->|run demo / hit endpoint| DemoApp
  DemoApp --> Config
  DemoApp --> APIClient
  DemoApp --> Server
  DemoApp --> Examples
  DemoApp --> Utils
  APIClient -->|HTTPS (REST/JSON)\nAuth: API_KEY or Bearer| Alloy
  Alloy -->|webhook (async events)| Webhook
  Webhook --> Server
  Server -->|process & persist| DB
  Server -->|enqueue for async work| Queue
  DemoApp --> Observability

  classDef external fill:#f9f,stroke:#333,stroke-width:1px;
  class Alloy external;

```

## Component responsibilities

- Config (.env / .env.example): store API_BASE_URL, API_KEY, WEBHOOK_SECRET, NODE_ENV.
- api/client.ts: central HTTP client with auth injection, retries and timeouts.
- server.ts: small Express server exposing demo endpoints (e.g. /run-demo) and /webhooks for async callbacks.
- webhooks/: verify signature, validate payload, and forward to business logic or queue.
- examples/: scripts or endpoints that run typical demo flows (create resource, poll status, etc.).
- utils/: logger, error wrappers, shared types.
- scripts/: helpers for local development (ngrok tunnel, seed data, docker-compose).

## Example sequence
1. Developer triggers demo (CLI or HTTP endpoint).
2. Demo App loads config and constructs API client.
3. Demo App sends HTTPS call to Alloy API to create a resource.
4. Alloy responds synchronously or responds with accepted and later sends webhook to /webhooks.
5. Demo App verifies webhook signature, updates DB or enqueues work, and records metrics.

## Security & operational notes
- Do not commit secrets; use .env and .env.example.
- Verify webhook signatures using WEBHOOK_SECRET.
- Use TLS for inbound/outbound traffic and set reasonable HTTP timeouts.
- Redact secrets from logs and limit log verbosity in production.

---

This file is intended to be rendered on GitHub (README/docs). If you want me to also replace docs/architecture.png with a rendered PNG/SVG of this Mermaid diagram (so the image file is viewable directly in places where Mermaid isn't supported), tell me and I will generate and commit an SVG or PNG version as well.