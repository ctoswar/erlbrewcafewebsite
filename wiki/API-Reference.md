# API Reference

Base URL: `https://your-domain.com/api`

## Authentication

Admin endpoints require a valid session cookie. Login via `POST /api/admin/login`.

---

## Public Endpoints

### Gallery

#### Get All Gallery Photos

```
GET /api/gallery
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "slot": 1,
      "filename": "abc123.jpg",
      "original_name": "cafe-interior.jpg",
      "mime_type": "image/jpeg",
      "file_size": 245000,
      "created_at": "2026-09-01T10:00:00.000Z",
      "updated_at": "2026-09-01T10:00:00.000Z"
    }
  ]
}
```

---

### About

#### Get About Photo

```
GET /api/about
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "filename": "about-photo.jpg",
    "original_name": "team-photo.jpg",
    "mime_type": "image/jpeg",
    "file_size": 180000
  }
}
```

---

### Business Hours

#### Get Business Hours

```
GET /api/hours
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "day_label": "Monday – Friday",
      "hours_text": "7:00 AM – 8:00 PM",
      "is_highlighted": false,
      "sort_order": 1
    },
    {
      "id": 2,
      "day_label": "Saturday",
      "hours_text": "7:00 AM – 9:00 PM",
      "is_highlighted": false,
      "sort_order": 2
    }
  ]
}
```

---

### Menu

#### Get Menu

```
GET /api/menu
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cat": "Coffee",
      "ja": "コーヒー",
      "sort_order": 1,
      "items": [
        {
          "id": 1,
          "name": "Espresso",
          "price": 120,
          "sort_order": 1
        },
        {
          "id": 2,
          "name": "Latte",
          "price": 150,
          "sort_order": 2
        }
      ]
    }
  ]
}
```

---

### Seasonal Recommendations

#### Get Seasonal Recommendations

```
GET /api/recommendations
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menu_item_id": 15,
      "season_name": "Matcha Season",
      "start_date": "2026-08-01",
      "end_date": "2026-09-30",
      "tags": "matcha,iced,seasonal",
      "description": "Limited-time matcha strawberry latte",
      "image_filename": "matcha-latte.jpg",
      "item_name": "Matcha Strawberry Latte",
      "item_price": 159
    }
  ]
}
```

---

### Seasonal Items

#### Get Current Seasonal Items

```
GET /api/seasonal
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "menu_item_id": 15,
      "season_name": "Matcha Season",
      "start_date": "2026-08-01",
      "end_date": "2026-09-30",
      "tags": "matcha,iced,seasonal",
      "description": "Limited-time matcha strawberry latte",
      "image_filename": "matcha-latte.jpg",
      "item_name": "Matcha Strawberry Latte",
      "item_price": 159
    }
  ]
}
```

---

### Events

#### Submit Event Inquiry

```
POST /api/events/inquiries
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "090-1234-5678",
  "event_type": "Birthday Party",
  "event_date": "2026-10-15",
  "guest_count": 20,
  "message": "Looking for a venue for a birthday celebration"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inquiry submitted successfully",
  "data": {
    "id": 1
  }
}
```

---

### Health Check

#### Check Server Health

```
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-09-11T12:00:00.000Z"
}
```

---

## Admin Endpoints

All admin endpoints require a valid session cookie (except login).

### Authentication

#### Login

```
POST /api/admin/login
```

**Request Body:**
```json
{
  "username": "admin",
  "password": "your-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful"
}
```

**Headers:**
```
Set-Cookie: erlbrew_session=<token>; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400
```

**Error Responses:**
- `400`: Missing username/password
- `401`: Invalid credentials
- `429`: Too many attempts (rate limited)

---

#### Logout

```
POST /api/admin/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out"
}
```

---

### Gallery Management

#### Upload Gallery Photo

```
POST /api/gallery/:slot
```

**Parameters:**
- `slot` (path): Gallery slot number (1-8)

**Request Body:** `multipart/form-data`
- `photo`: Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "success": true,
  "message": "Photo uploaded",
  "data": {
    "slot": 1,
    "filename": "abc123.jpg",
    "original_name": "cafe-photo.jpg"
  }
}
```

---

#### Delete Gallery Photo

```
DELETE /api/gallery/:slot
```

**Parameters:**
- `slot` (path): Gallery slot number

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted"
}
```

---

### Menu Management

#### Add Menu Category

```
POST /api/menu/categories
```

**Request Body:**
```json
{
  "cat": "Coffee",
  "ja": "コーヒー",
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Category created",
  "data": {
    "id": 1
  }
}
```

---

#### Update Menu Category

```
PUT /api/menu/categories/:id
```

**Parameters:**
- `id` (path): Category ID

**Request Body:**
```json
{
  "cat": "Specialty Coffee",
  "ja": "スペシャルティコーヒー",
  "sort_order": 1
}
```

---

#### Delete Menu Category

```
DELETE /api/menu/categories/:id
```

**Parameters:**
- `id` (path): Category ID

**Response:**
```json
{
  "success": true,
  "message": "Category deleted"
}
```

---

#### Add Menu Item

```
POST /api/menu/items
```

**Request Body:**
```json
{
  "category_id": 1,
  "name": "Espresso",
  "price": 120,
  "sort_order": 1
}
```

---

#### Update Menu Item

```
PUT /api/menu/items/:id
```

**Parameters:**
- `id` (path): Item ID

**Request Body:**
```json
{
  "name": "Double Espresso",
  "price": 180,
  "sort_order": 1
}
```

---

#### Delete Menu Item

```
DELETE /api/menu/items/:id
```

**Parameters:**
- `id` (path): Item ID

---

### Business Hours Management

#### Update Business Hours

```
PUT /api/hours/:id
```

**Parameters:**
- `id` (path): Hours entry ID

**Request Body:**
```json
{
  "day_label": "Monday – Friday",
  "hours_text": "8:00 AM – 9:00 PM",
  "is_highlighted": false,
  "sort_order": 1
}
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status Code | Description |
|-------------|-------------|
| 400 | Bad request (missing/invalid parameters) |
| 401 | Authentication required |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## Rate Limiting

Login endpoint is rate-limited:
- **Max attempts**: 5 per 15 minutes
- **Block duration**: 15 minutes
- **Response**: `429 Too Many Requests` with `Retry-After` header
