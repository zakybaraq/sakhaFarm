# API Reference

## Base URL
```
http://localhost:3000
```

## Authentication
All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <jwt-token>
```

## Response Format
```json
{
  "success": true,
  "data": { }
}
```

Error response:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login with email/password |
| POST | /auth/logout | Logout and invalidate session |

### Units
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/units | List all units |
| POST | /api/units | Create new unit |
| GET | /api/units/:id | Get unit by ID |
| PUT | /api/units/:id | Update unit |
| DELETE | /api/units/:id | Soft delete unit |

### Plasmas
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/plasmas | List all plasmas |
| POST | /api/plasmas | Create new plasma |
| GET | /api/plasmas/:id | Get plasma by ID |
| PUT | /api/plasmas/:id | Update plasma |
| DELETE | /api/plasmas/:id | Soft delete plasma |

### Cycles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cycles | List all cycles |
| POST | /api/cycles | Create new cycle (chick-in) |
| GET | /api/cycles/:id | Get cycle by ID |
| PUT | /api/cycles/:id | Update cycle |
| POST | /api/cycles/:id/complete | Mark cycle complete |
| POST | /api/cycles/:id/fail | Mark cycle failed |

### Recordings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/recordings | List recordings for cycle |
| POST | /api/recordings | Create daily recording |
| GET | /api/recordings/:id | Get recording |
| PUT | /api/recordings/:id | Update recording |

### Feed
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/feed/products | List feed products |
| POST | /api/feed/products | Create feed product |
| POST | /api/feed/surat-jalan | Create Surat Jalan (feed in) |
| GET | /api/feed/stock | Get feed stock |

### RBAC
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/rbac/roles | List roles |
| POST | /api/rbac/roles | Create role |
| GET | /api/rbac/permissions | List permissions |
| PUT | /api/rbac/roles/:id/permissions | Update role permissions |

### Users
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/users | List users | Admin |
| POST | /api/users | Create user | Admin |
| GET | /api/users/:id | Get user | Admin |
| PUT | /api/users/:id | Update user | Admin |
| DELETE | /api/users/:id | Deactivate user | Admin |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |