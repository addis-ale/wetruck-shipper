# CAPTCHA API Endpoints Documentation

## Overview
This document describes the CAPTCHA API endpoints that must be integrated into the frontend authentication flows to prevent automated attacks.

## Base URL
```
http://localhost:8000/api/auth
```

## Endpoints

### 1. Generate CAPTCHA Image
**GET** `/captcha`

Generates a new CAPTCHA image and returns it as a PNG image with a unique CAPTCHA ID in the response headers.

#### Response
- **Content-Type**: `image/png`
- **Headers**:
  - `X-Captcha-Id`: Unique identifier for the CAPTCHA (required for verification)
- **Body**: Binary PNG image data (280x90 pixels)

#### Example Response Headers:
```
Content-Type: image/png
X-Captcha-Id: 550e8400-e29b-41d4-a716-446655440000
```

#### Usage:
```javascript
const response = await fetch('/api/auth/captcha');
const captchaId = response.headers.get('X-Captcha-Id');
const imageBlob = await response.blob();
const imageUrl = URL.createObjectURL(imageBlob);
```

---

### 2. Verify CAPTCHA Solution
**POST** `/verify-captcha`

Verifies if the provided CAPTCHA solution is correct.

#### Request Body
Content-Type: `application/x-www-form-urlencoded`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| captcha_id | string | Yes | The CAPTCHA ID received from the image endpoint |
| captcha_solution | string | Yes | The text entered by the user |

#### Request Example:
```javascript
const formData = new FormData();
formData.append('captcha_id', '550e8400-e29b-41d4-a716-446655440000');
formData.append('captcha_solution', 'ABC123');

const response = await fetch('/api/auth/verify-captcha', {
  method: 'POST',
  body: formData
});
```

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "CAPTCHA verified"
}
```

#### Error Responses:
- **400 Bad Request** - Invalid CAPTCHA ID
```json
{
  "detail": "Invalid CAPTCHA ID"
}
```

- **400 Bad Request** - Incorrect CAPTCHA solution
```json
{
  "detail": "Incorrect CAPTCHA"
}
```

---

### 3. Login with CAPTCHA
**POST** `/login`

Authenticates user credentials after CAPTCHA verification.

#### Request Body
Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |
| role | string | Yes | User role (shipper/transporter/admin) |
| captcha_id | string | Yes | Valid CAPTCHA ID |
| captcha_solution | string | Yes | Correct CAPTCHA solution |

#### Request Example:
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "shipper",
  "captcha_id": "550e8400-e29b-41d4-a716-446655440000",
  "captcha_solution": "ABC123"
}
```

#### Success Response (200 OK)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "shipper",
  "expires_in": 3600
}
```

#### Error Responses:
- **400 Bad Request** - Invalid CAPTCHA (same as verify-captcha endpoint)
- **401 Unauthorized** - Invalid credentials
- **404 Not Found** - User not found

---

### 4. Reset Password with CAPTCHA
**POST** `/request-password-reset`

Initiates password reset process after CAPTCHA verification.

#### Request Body
Content-Type: `application/json`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| captcha_id | string | Yes | Valid CAPTCHA ID |
| captcha_solution | string | Yes | Correct CAPTCHA solution |

#### Request Example:
```json
{
  "email": "user@example.com",
  "captcha_id": "550e8400-e29b-41d4-a716-446655440000",
  "captcha_solution": "ABC123"
}
```

#### Success Response (200 OK)
```json
{
  "message": "Password reset instructions sent to your email"
}
```

#### Error Responses:
- **400 Bad Request** - Invalid CAPTCHA
- **404 Not Found** - Email not found in system

---

## CAPTCHA Characteristics

### Image Properties
- **Dimensions**: 280x90 pixels
- **Format**: PNG
- **Text Length**: 6 characters
- **Character Set**: Uppercase letters (A-Z) and digits (0-9)
- **Expiration**: 60 seconds after generation

### Security Features
- **Case Insensitive**: Solutions are compared case-insensitively
- **One-time Use**: CAPTCHAs are deleted after successful verification
- **Auto-expiration**: Expired CAPTCHAs cannot be verified
- **Unique IDs**: Each CAPTCHA has a unique UUID identifier

## Integration Flow

### Login Flow:
1. Request CAPTCHA image → Get image + captcha_id
2. Display image to user
3. User enters solution
4. Submit login form with captcha_id and captcha_solution
5. Backend verifies CAPTCHA and credentials
6. Return authentication tokens on success

### Password Reset Flow:
1. Request CAPTCHA image → Get image + captcha_id
2. Display image to user
3. User enters solution + email
4. Submit reset request with captcha_id and captcha_solution
5. Backend verifies CAPTCHA and processes reset request

## Error Handling Best Practices

1. **CAPTCHA Expiration**: Handle 60-second timeout gracefully
2. **Invalid CAPTCHA**: Allow user to request a new CAPTCHA
3. **Failed Attempts**: Limit CAPTCHA refresh attempts to prevent abuse
4. **Network Issues**: Provide fallback options or retry mechanisms

## Rate Limiting Considerations

- CAPTCHA requests should be limited per IP/session
- Failed verification attempts should be tracked
- Consider implementing progressive delays for repeated failures
