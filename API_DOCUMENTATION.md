# FAQ Chatbot Admin Dashboard - API Documentation

## Overview

The admin dashboard provides a comprehensive REST API for managing the FAQ chatbot system. All endpoints require authentication except for health checks and login.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

---

## 🔐 Authentication Endpoints

### POST /auth/login

Login to the admin dashboard.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "admin",
      "email": "admin@diskominfo.go.id",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00.000Z",
      "is_active": true
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid credentials",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /auth/logout

Logout from the admin dashboard.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /auth/verify

Verify JWT token validity.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "user": {
      "id": "1",
      "username": "admin",
      "email": "admin@diskominfo.go.id",
      "role": "admin"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📚 FAQ Management Endpoints

### GET /faq/:env

Get all FAQs for a specific environment.

**Parameters:**
- `env` (path): Environment type (`stunting` | `ppid`)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "faqs": [
      {
        "id": 1,
        "questions": [
          "apa itu stunting",
          "definisi stunting",
          "pengertian stunting"
        ],
        "answer": "Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis...",
        "category": "definisi"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /faq/:env

Add a new FAQ entry. Requires `admin` or `editor` role.

**Parameters:**
- `env` (path): Environment type (`stunting` | `ppid`)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "questions": [
    "apa itu stunting",
    "definisi stunting",
    "pengertian stunting"
  ],
  "answer": "Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis dalam 1000 hari pertama kehidupan.",
  "category": "definisi"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 15,
    "questions": [
      "apa itu stunting",
      "definisi stunting",
      "pengertian stunting"
    ],
    "answer": "Stunting adalah kondisi gagal tumbuh pada anak balita akibat kekurangan gizi kronis dalam 1000 hari pertama kehidupan.",
    "category": "definisi"
  },
  "message": "FAQ added successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Validation Errors (400 Bad Request):**
```json
{
  "success": false,
  "error": "Questions array is required and cannot be empty",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### PUT /faq/:env/:id

Update an existing FAQ entry. Requires `admin` or `editor` role.

**Parameters:**
- `env` (path): Environment type (`stunting` | `ppid`)
- `id` (path): FAQ ID

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (partial update allowed):**
```json
{
  "questions": [
    "apa itu stunting",
    "definisi stunting"
  ],
  "answer": "Updated answer about stunting...",
  "category": "definisi"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "questions": [
      "apa itu stunting",
      "definisi stunting"
    ],
    "answer": "Updated answer about stunting...",
    "category": "definisi"
  },
  "message": "FAQ updated successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### DELETE /faq/:env/:id

Delete an FAQ entry. Requires `admin` or `editor` role.

**Parameters:**
- `env` (path): Environment type (`stunting` | `ppid`)
- `id` (path): FAQ ID

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "questions": ["apa itu stunting"],
    "answer": "Stunting adalah...",
    "category": "definisi"
  },
  "message": "FAQ deleted successfully",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /faq/:env/categories

Get available categories for an environment.

**Parameters:**
- `env` (path): Environment type (`stunting` | `ppid`)

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "definisi",
        "description": "Pengertian dan definisi stunting"
      },
      {
        "category": "pencegahan",
        "description": "Cara mencegah stunting"
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📊 Analytics Endpoints

### GET /analytics

Get comprehensive analytics data.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `env` (optional): Filter by environment (`stunting` | `ppid`)
- `days` (optional): Number of days for date range (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_questions": 1250,
    "total_sessions": 890,
    "average_confidence": 0.87,
    "popular_questions": [
      {
        "question": "Apa itu stunting?",
        "count": 45,
        "avg_confidence": 0.95
      },
      {
        "question": "Cara mencegah stunting",
        "count": 38,
        "avg_confidence": 0.89
      }
    ],
    "category_distribution": [
      {
        "category": "definisi",
        "count": 120,
        "percentage": 35
      },
      {
        "category": "pencegahan",
        "count": 85,
        "percentage": 25
      }
    ],
    "confidence_distribution": [
      {
        "range": "0.9-1.0",
        "count": 450,
        "percentage": 60
      },
      {
        "range": "0.7-0.9",
        "count": 200,
        "percentage": 27
      }
    ],
    "daily_stats": [
      {
        "date": "2024-01-01",
        "questions": 45,
        "avg_confidence": 0.88
      },
      {
        "date": "2024-01-02",
        "questions": 52,
        "avg_confidence": 0.86
      }
    ],
    "env_distribution": [
      {
        "env": "stunting",
        "count": 800,
        "percentage": 64
      },
      {
        "env": "ppid",
        "count": 450,
        "percentage": 36
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📋 Log Management Endpoints

### GET /logs

Get chat logs with pagination and filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `env` (optional): Filter by environment (`stunting` | `ppid`)
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `search` (optional): Search in questions and answers
- `category` (optional): Filter by category
- `minConfidence` (optional): Minimum confidence score (0-1)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "log_123",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "question": "Apa itu stunting?",
      "answer": "Stunting adalah kondisi gagal tumbuh...",
      "confidence": 0.95,
      "category": "definisi",
      "env": "stunting",
      "status": "success",
      "response_time": 150,
      "user_ip": "192.168.1.1",
      "user_agent": "Mozilla/5.0..."
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "total_pages": 25,
    "has_next": true,
    "has_prev": false
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 🏥 Health Monitoring Endpoints

### GET /health

Check overall system health (no authentication required).

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "services": {
      "python_bot": {
        "status": "online",
        "response_time": 45,
        "last_check": "2024-01-01T12:00:00.000Z",
        "version": "1.0.0",
        "nlp_ready": true
      },
      "database": {
        "status": "connected",
        "response_time": 5,
        "last_check": "2024-01-01T12:00:00.000Z"
      },
      "files": {
        "faq_stunting": true,
        "faq_ppid": true,
        "logs": true,
        "backups": true
      }
    },
    "uptime": 86400,
    "memory_usage": {
      "rss": 52428800,
      "heapTotal": 29360128,
      "heapUsed": 20971520,
      "external": 1048576
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### GET /health/python-bot

Check Python bot health specifically.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "message": "FAQ Chatbot is running",
    "nlp_ready": true,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0",
    "supported_envs": ["stunting", "ppid"]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /health/test-chat

Test chatbot functionality.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "question": "Apa itu stunting?",
  "env": "stunting"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "answer": "Stunting adalah kondisi gagal tumbuh pada anak balita...",
    "confidence": 0.95,
    "category": "definisi",
    "status": "success",
    "source_faq_id": 1
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 🌐 Website Monitoring Endpoints

### GET /websites

Get list of websites using the chatbot service.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "url": "https://diskominfo.example.com",
      "name": "Diskominfo Website",
      "status": "active",
      "last_ping": "2024-01-01T12:00:00.000Z",
      "response_time": 250,
      "chatbot_version": "1.0.0",
      "total_requests": 1500,
      "last_request": "2024-01-01T11:55:00.000Z"
    }
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 🔌 WebSocket Events

The admin dashboard uses WebSocket for real-time updates. Connect to:

- **Development**: `ws://localhost:3001`
- **Production**: `wss://yourdomain.com`

### Authentication

Send authentication after connection:

```javascript
socket.emit('authenticate', { token: 'your-jwt-token' });
```

### Events

#### Incoming Events (Server → Client)

**connected**
```json
{
  "message": "Connected to FAQ Admin Dashboard",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**new_chat**
```json
{
  "type": "new_question",
  "data": {
    "question": "Apa itu stunting?",
    "answer": "Stunting adalah...",
    "confidence": 0.95,
    "env": "stunting",
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**system_status**
```json
{
  "type": "system_status",
  "data": {
    "python_bot": "online",
    "database": "connected",
    "memory_usage": 75
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**faq_updated**
```json
{
  "type": "faq_updated",
  "data": {
    "env": "stunting",
    "operation": "created",
    "faq": {
      "id": 15,
      "questions": ["new question"],
      "answer": "new answer",
      "category": "new"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 🚫 Error Handling

### Standard Error Response

All API endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Scenarios

**Authentication Required (401)**
```json
{
  "success": false,
  "error": "Access token is required",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Invalid Token (401)**
```json
{
  "success": false,
  "error": "Invalid access token",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Insufficient Permissions (403)**
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "error": "Questions array is required and cannot be empty",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Rate Limited (429)**
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Python Bot Unavailable (503)**
```json
{
  "success": false,
  "error": "Python bot is not accessible",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📝 Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Default**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per minute per IP
- **Headers included in response**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

---

## 🔧 Development & Testing

### Testing API Endpoints

Use tools like Postman, Insomnia, or curl:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get FAQs (with token)
curl -X GET http://localhost:3001/api/faq/stunting \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Health check (no auth required)
curl -X GET http://localhost:3001/api/health
```

### Environment Variables

Key environment variables for API configuration:

```env
# Server
PORT=3001
NODE_ENV=development

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Python Bot
PYTHON_BOT_URL=http://localhost:5000
PYTHON_BOT_TIMEOUT=30000

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=900000

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 📚 Additional Resources

- [Main Documentation](README.md)
- [Setup Guide](setup.ps1)
- [WebSocket Documentation](#-websocket-events)
- [Error Handling](#-error-handling)

For more detailed implementation examples, check the source code in `admin-backend/src/routes/`.
