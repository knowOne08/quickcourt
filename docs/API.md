# QuickCourt API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Routes `/api/auth`

#### POST /register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "user" // "user", "facility_owner", "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "isVerified": false
    }
  }
}
```

#### POST /login
Authenticate user and get access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /verify-email
Verify user email with OTP.

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### POST /forgot-password
Request password reset.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

#### POST /reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

### Venue Routes `/api/venues`

#### GET /venues
Get all venues with filtering and pagination.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `location` (string): Filter by location
- `sport` (string): Filter by sport type
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (rating, price, name)
- `sortOrder` (string): asc or desc

**Response:**
```json
{
  "success": true,
  "data": {
    "venues": [
      {
        "_id": "venue_id",
        "name": "Elite Sports Complex",
        "description": "Premium sports facility",
        "location": {
          "address": "123 Sports St, City",
          "coordinates": [latitude, longitude]
        },
        "sports": ["badminton", "tennis"],
        "amenities": ["parking", "changing_room"],
        "images": ["image_url1", "image_url2"],
        "pricing": {
          "hourly": 500,
          "currency": "INR"
        },
        "rating": {
          "average": 4.5,
          "count": 120
        },
        "owner": "owner_id",
        "status": "approved",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalVenues": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### GET /venues/:id
Get venue details by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "venue": {
      "_id": "venue_id",
      "name": "Elite Sports Complex",
      "description": "Premium sports facility with modern amenities",
      "location": {
        "address": "123 Sports St, Ahmedabad, Gujarat",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "pincode": "380001",
        "coordinates": [23.0225, 72.5714]
      },
      "sports": ["badminton", "tennis", "squash"],
      "amenities": ["parking", "changing_room", "shower", "cafeteria"],
      "images": ["image_url1", "image_url2"],
      "pricing": {
        "hourly": 500,
        "currency": "INR"
      },
      "availability": {
        "openTime": "06:00",
        "closeTime": "23:00",
        "weeklyOff": ["sunday"]
      },
      "rating": {
        "average": 4.5,
        "count": 120
      },
      "reviews": [
        {
          "_id": "review_id",
          "user": {
            "name": "User Name",
            "avatar": "avatar_url"
          },
          "rating": 5,
          "comment": "Excellent facility!",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "owner": {
        "_id": "owner_id",
        "name": "Owner Name",
        "phone": "+1234567890"
      },
      "status": "approved",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### POST /venues (Protected - Owner/Admin)
Create a new venue.

**Request Body:**
```json
{
  "name": "New Sports Complex",
  "description": "Modern sports facility",
  "location": {
    "address": "456 New St, City",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "coordinates": [19.0760, 72.8777]
  },
  "sports": ["cricket", "football"],
  "amenities": ["parking", "changing_room"],
  "pricing": {
    "hourly": 800,
    "currency": "INR"
  },
  "availability": {
    "openTime": "06:00",
    "closeTime": "22:00",
    "weeklyOff": ["monday"]
  }
}
```

#### PUT /venues/:id (Protected - Owner/Admin)
Update venue details.

#### DELETE /venues/:id (Protected - Owner/Admin)
Delete a venue.

### Booking Routes `/api/bookings`

#### GET /bookings (Protected)
Get user's bookings.

**Query Parameters:**
- `status` (string): Filter by booking status
- `page` (number): Page number
- `limit` (number): Items per page

**Response:**
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "booking_id",
        "venue": {
          "_id": "venue_id",
          "name": "Elite Sports Complex",
          "location": {
            "address": "123 Sports St, City"
          }
        },
        "user": {
          "_id": "user_id",
          "name": "John Doe",
          "email": "john@example.com"
        },
        "date": "2024-02-15",
        "timeSlot": {
          "start": "10:00",
          "end": "11:00"
        },
        "sport": "badminton",
        "totalAmount": 500,
        "status": "confirmed",
        "payment": {
          "transactionId": "txn_123",
          "method": "card",
          "status": "completed"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBookings": 25
    }
  }
}
```

#### POST /bookings (Protected)
Create a new booking.

**Request Body:**
```json
{
  "venueId": "venue_id",
  "date": "2024-02-15",
  "timeSlot": {
    "start": "10:00",
    "end": "11:00"
  },
  "sport": "badminton",
  "paymentMethod": "card"
}
```

#### GET /bookings/venue/:venueId/availability
Get available time slots for a venue on a specific date.

**Query Parameters:**
- `date` (string): Date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "availableSlots": [
      {
        "start": "06:00",
        "end": "07:00",
        "available": true
      },
      {
        "start": "07:00",
        "end": "08:00",
        "available": false
      }
    ],
    "venue": {
      "_id": "venue_id",
      "name": "Elite Sports Complex",
      "pricing": {
        "hourly": 500
      }
    }
  }
}
```

#### PUT /bookings/:id/cancel (Protected)
Cancel a booking.

### Payment Routes `/api/payments`

#### POST /payments/create-order (Protected)
Create payment order.

**Request Body:**
```json
{
  "bookingId": "booking_id",
  "amount": 500,
  "currency": "INR"
}
```

#### POST /payments/verify (Protected)
Verify payment completion.

**Request Body:**
```json
{
  "orderId": "order_id",
  "paymentId": "payment_id",
  "signature": "payment_signature"
}
```

### User Routes `/api/users`

#### GET /users/profile (Protected)
Get current user profile.

#### PUT /users/profile (Protected)
Update user profile.

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "preferences": {
    "sports": ["badminton", "tennis"],
    "location": "Ahmedabad"
  }
}
```

#### POST /users/upload-avatar (Protected)
Upload user avatar image.

### Owner Routes `/api/owner`

#### GET /owner/venues (Protected - Owner)
Get owner's venues.

#### GET /owner/bookings (Protected - Owner)
Get bookings for owner's venues.

#### GET /owner/analytics (Protected - Owner)
Get venue analytics and statistics.

### Admin Routes `/api/admin`

#### GET /admin/venues/pending (Protected - Admin)
Get venues pending approval.

#### PUT /admin/venues/:id/approve (Protected - Admin)
Approve a venue.

#### GET /admin/users (Protected - Admin)
Get all users with filtering.

#### GET /admin/analytics (Protected - Admin)
Get platform analytics.

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error details"
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` (400): Invalid request data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error

## Rate Limiting

API endpoints are rate-limited:
- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per minute
- File upload endpoints: 10 requests per minute

## Pagination

List endpoints support pagination with these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Pagination response includes:
```json
{
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "hasNext": true,
    "hasPrev": false
  }
}
```
