# Perfprox API

API for managing custom hostnames for the Perfprox CNAME proxy service.

Base URL: `https://api.perfprox.com`

## Authentication

All endpoints require authentication via the `Authorization` header:

```
Authorization: Bearer <PERFPROX_API_TOKEN>
```

## Endpoints

### Create Hostname

**POST** `/hostnames`

Register a new custom hostname with the proxy service.

**Request Body:**

```json
{
	"hostname": "custom.example.com",
	"origin": "https://your-origin.com",
	"path": { "prefix": "/api" }
}
```

| Field         | Type   | Required | Description                                                       |
| ------------- | ------ | -------- | ----------------------------------------------------------------- |
| `hostname`    | string | Yes      | The custom hostname to register (max 253 chars)                   |
| `origin`      | string | Yes      | The origin URL to proxy requests to (must be http:// or https://) |
| `path`        | object | No       | Path configuration for request forwarding                         |
| `path.prefix` | string | No       | Path prefix to prepend to all requests (e.g., `/api`)             |

**Path Prefix Normalization:**

The `path.prefix` value is automatically normalized:

- Whitespace is trimmed from both ends
- A leading `/` is added if missing
- A trailing `/` is removed if present
- If the result is just `/` or empty, the path is not stored

| Input      | Stored Value   |
| ---------- | -------------- |
| `"api"`    | `"/api"`       |
| `"/api/"`  | `"/api"`       |
| `" /api "` | `"/api"`       |
| `"/"`      | _(not stored)_ |

**Success Response (201):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://your-origin.com",
		"path": { "prefix": "/api" },
		"enabled": true,
		"status": "pending_dns",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T12:00:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                                                             |
| ------ | ----------------------------------------------------------------------- |
| 400    | Invalid hostname format, invalid origin URL, or missing required fields |
| 409    | Hostname already exists                                                 |
| 502    | Failed to create hostname in Cloudflare                                 |

---

### Get Hostname

**GET** `/hostnames/:hostname`

Retrieve details and status of a registered hostname.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://your-origin.com",
		"enabled": true,
		"status": "active",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T12:30:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                |
| ------ | -------------------------- |
| 400    | Missing hostname parameter |
| 404    | Hostname not found         |

---

### Update Hostname

**PATCH** `/hostnames/:hostname`

Update settings for an existing hostname, such as changing the origin URL or path prefix.

**Request Body:**

```json
{
	"origin": "https://new-origin.com",
	"path": { "prefix": "/v2/api" }
}
```

| Field         | Type           | Required | Description                                                       |
| ------------- | -------------- | -------- | ----------------------------------------------------------------- |
| `origin`      | string         | No       | New origin URL to proxy requests to (must be http:// or https://) |
| `path`        | object \| null | No       | Path configuration (set to `null` or `{}` to remove)              |
| `path.prefix` | string         | No       | Path prefix to prepend to all requests                            |

**Partial Updates:**

Fields not included in the request body are preserved. For example, updating only `origin` will keep the existing `path`:

```json
{ "origin": "https://new-origin.com" }
```

**Removing Path Configuration:**

To remove an existing path configuration, explicitly set `path` to `null` or an empty object:

```json
{ "path": null }
```

or

```json
{ "path": {} }
```

**Empty Body:**

An empty body `{}` returns 400 Bad Request with "No valid fields to update".

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://new-origin.com",
		"path": { "prefix": "/v2/api" },
		"enabled": true,
		"status": "active",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T14:00:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                                                                         |
| ------ | ----------------------------------------------------------------------------------- |
| 400    | Missing hostname parameter, invalid origin URL format, or no valid fields to update |
| 404    | Hostname not found                                                                  |

---

### Sync Hostname Status

**POST** `/hostnames/:hostname/status`

Query Cloudflare for the current status of the hostname and update the local record.

Use this endpoint after the customer has configured their DNS to check if validation has completed.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://your-origin.com",
		"enabled": true,
		"status": "active",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T12:45:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                          |
| ------ | ------------------------------------ |
| 400    | Missing hostname parameter           |
| 404    | Hostname not found                   |
| 502    | Failed to get status from Cloudflare |

---

### Disable Hostname

**POST** `/hostnames/:hostname/disable`

Disable a hostname to stop proxying requests. The hostname remains registered but will not serve traffic.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://your-origin.com",
		"enabled": false,
		"status": "disabled",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T13:00:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                |
| ------ | -------------------------- |
| 400    | Missing hostname parameter |
| 404    | Hostname not found         |

---

### Enable Hostname

**POST** `/hostnames/:hostname/enable`

Re-enable a previously disabled hostname.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"hostname": "custom.example.com",
		"origin": "https://your-origin.com",
		"enabled": true,
		"status": "pending_dns",
		"cfId": "cf-hostname-id",
		"sslMethod": "http",
		"createdAt": "2025-01-15T12:00:00.000Z",
		"updatedAt": "2025-01-15T13:15:00.000Z"
	}
}
```

**Error Responses:**

| Status | Description                |
| ------ | -------------------------- |
| 400    | Missing hostname parameter |
| 404    | Hostname not found         |

---

### Delete Hostname

**DELETE** `/hostnames/:hostname`

Remove a hostname from the system and Cloudflare.

**Success Response (200):**

```json
{
	"success": true,
	"data": {
		"deleted": true,
		"hostname": "custom.example.com"
	}
}
```

**Error Responses:**

| Status | Description                |
| ------ | -------------------------- |
| 400    | Missing hostname parameter |
| 404    | Hostname not found         |

---

## Host Status Lifecycle

Hostnames progress through the following statuses:

| Status        | Description                                                        |
| ------------- | ------------------------------------------------------------------ |
| `pending_dns` | Hostname created, waiting for customer to configure DNS            |
| `validating`  | DNS configured, Cloudflare is validating ownership and issuing SSL |
| `active`      | Hostname is fully validated and proxying traffic                   |
| `failed`      | Validation failed (check DNS configuration)                        |
| `disabled`    | Hostname manually disabled via the disable endpoint                |

## Example Workflow

1. **Create hostname** - Call `POST /hostnames` with the customer's hostname and origin
2. **Wait for DNS propagation** - Customer configures their CNAME record
3. **Check status** - Call `POST /hostnames/:hostname/status` to check validation progress
4. **Repeat status check** - Continue checking until status is `active` or `failed`

## Path Prefix Feature

The path prefix feature allows you to route multiple custom hostnames to different paths on a single origin server. This is useful when running multiple services on a monorepo deployment (e.g., Render.com) where you want different subdomains to map to different application routes.

**Example Use Case:**

You have a single origin at `https://myapp.onrender.com` running multiple services:

- `/api/*` - API service
- `/app/*` - Web application
- `/docs/*` - Documentation

You can create separate custom hostnames that route to each service:

```bash
# API subdomain
curl -X POST https://api.perfprox.com/hostnames \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hostname": "api.example.com", "origin": "https://myapp.onrender.com", "path": {"prefix": "/api"}}'

# App subdomain
curl -X POST https://api.perfprox.com/hostnames \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hostname": "app.example.com", "origin": "https://myapp.onrender.com", "path": {"prefix": "/app"}}'

# Docs subdomain
curl -X POST https://api.perfprox.com/hostnames \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hostname": "docs.example.com", "origin": "https://myapp.onrender.com", "path": {"prefix": "/docs"}}'
```

**Request Flow:**

| Incoming Request                           | Forwarded To                                      |
| ------------------------------------------ | ------------------------------------------------- |
| `https://api.example.com/users`            | `https://myapp.onrender.com/api/users`            |
| `https://app.example.com/dashboard`        | `https://myapp.onrender.com/app/dashboard`        |
| `https://docs.example.com/getting-started` | `https://myapp.onrender.com/docs/getting-started` |
