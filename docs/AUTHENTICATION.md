# Authentication Guide

The Kobliat Conversations Platform API Gateway supports three authentication methods. You can use any of these methods to authenticate your requests.

## 1. API Key Authentication (Recommended)

Send your API key in the `X-API-Key` header.

**Example:**
```bash
curl -H "X-API-Key: kobliat-secret-key" \
     http://localhost:8000/api/v1/conversations
```

**Configuration:**
Set `API_GATEWAY_KEY` in your `.env` file (default: `kobliat-secret-key`)

## 2. Bearer Token Authentication

Send a bearer token in the `Authorization` header.

**Example:**
```bash
curl -H "Authorization: Bearer kobliat-bearer-token" \
     http://localhost:8000/api/v1/conversations
```

**Configuration:**
Set `API_BEARER_TOKEN` in your `.env` file (default: `kobliat-bearer-token`)

## 3. Basic Authentication

Send username and password using HTTP Basic Auth.

**Example:**
```bash
curl -u admin:kobliat-password \
     http://localhost:8000/api/v1/conversations
```

**Configuration:**
Set `API_BASIC_AUTH` in your `.env` file in the format `username:password` (default: `admin:kobliat-password`)

## Priority

If multiple authentication methods are provided in a single request, they are checked in this order:
1. API Key (X-API-Key header)
2. Bearer Token (Authorization: Bearer)
3. Basic Auth (Authorization: Basic)

The first valid authentication method found will be used.

## Postman Collection

The included Postman collection (`postman_collection.json`) demonstrates all three authentication methods:

1. **Collection-level Auth**: API Key is set as the default for all requests
2. **Authentication Examples Folder**: Contains example requests for each auth method
3. **Variables**: Configure your credentials in the collection variables:
   - `api_key`
   - `bearer_token`
   - `basic_auth_username`
   - `basic_auth_password`

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file out of version control
2. **Use strong tokens**: Change default values in production
3. **Rotate credentials**: Regularly update your API keys and tokens
4. **Use HTTPS**: Always use HTTPS in production environments
5. **Limit scope**: Use different credentials for different environments (dev, staging, prod)
