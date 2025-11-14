# Alloy Connectivity API Endpoint Pattern Summary

## ✅ Confirmed Endpoint Pattern

Based on documentation research and testing:

```
POST https://production.runalloy.com/connectors/{connectorId}/actions/{actionId}/execute
```

## Complete Endpoint Structure

### Base URL
- **OAuth & Credentials**: `https://production.runalloy.com`
- **Action Execution**: `https://production.runalloy.com` (same base URL)

### Endpoint Pattern
```
POST /connectors/{connectorId}/actions/{actionId}/execute
```

### Headers
```http
Authorization: Bearer {apiKey}
x-api-version: 2025-09
Content-Type: application/json
```

### Request Body Structure
```json
{
  "credentialId": "credential_id_from_oauth_or_credentials_list",
  "requestBody": {
    // Connector-specific request body (e.g., Notion API request)
  },
  "headers": {
    // Connector-specific headers (e.g., "Notion-Version": "2022-06-28")
  },
  "pathParams": {
    // Optional: Path parameters for actions with IDs in URL
  },
  "queryParameters": {
    // Optional: Query parameters
  }
}
```

## Example: Notion Search Pages

```typescript
POST https://production.runalloy.com/connectors/notion/actions/post-search/execute

Headers:
  Authorization: Bearer {apiKey}
  x-api-version: 2025-09
  Content-Type: application/json

Body:
{
  "credentialId": "your_credential_id_here",
  "requestBody": {
    "filter": {
      "value": "page",
      "property": "object"
    },
    "page_size": 10
  },
  "headers": {
    "Notion-Version": "2022-06-28"
  }
}
```

## Example: Notion Create Page

```typescript
POST https://production.runalloy.com/connectors/notion/actions/post-page/execute

Body:
{
  "credentialId": "credential_id",
  "requestBody": {
    "parent": {
      "type": "workspace",
      "workspace": true
    },
    "properties": {
      "title": {
        "type": "title",
        "title": [
          {
            "type": "text",
            "text": {
              "content": "Page Title"
            }
          }
        ]
      }
    }
  },
  "headers": {
    "Notion-Version": "2022-06-28"
  }
}
```

## Example: Notion Retrieve Page

```typescript
POST https://production.runalloy.com/connectors/notion/actions/retrieve-a-page/execute

Body:
{
  "credentialId": "credential_id",
  "pathParams": {
    "page_id": "page_id_here"
  },
  "headers": {
    "Notion-Version": "2022-06-28"
  }
}
```

## Key Points

1. **Endpoint Pattern**: `/connectors/{connectorId}/actions/{actionId}/execute`
2. **Base URL**: `https://production.runalloy.com`
3. **Method**: `POST` (for all actions, including GET operations like retrieve-a-page)
4. **credentialId**: Required in request body
5. **requestBody**: Contains the actual connector API request
6. **headers**: Connector-specific headers (e.g., Notion-Version)
7. **pathParams**: For actions with path parameters (e.g., {page_id})

## Status

- ✅ Endpoint pattern confirmed
- ✅ Base URL confirmed
- ⚠️ Request body structure needs final verification
- ⚠️ Credential ID usage needs confirmation

## References

- Alloy Documentation: https://docs.runalloy.com/connectivity-api
- Notion API: https://developers.notion.com/reference

