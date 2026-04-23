# E-Auth System - API Documentation

## Overview

Role-based authentication system with JWT tokens. Admin users get special access to protected routes.

---

## Features Implemented

✅ User registration with automatic role assignment  
✅ OTP-based authentication  
✅ JWT token generation with role information  
✅ Token verification middleware  
✅ Role-based access control (RBAC)  
✅ Protected admin routes  
✅ Comprehensive logging and error handling  

---

## API Endpoints

### 1. **POST /auth/login**
Generate and send OTP to user.

**Request:**
```json
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "username": "testuser"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent (check terminal)"
}
```

**Console Output:**
```
👤 New user created: testuser with role: user
📱 OTP for testuser : 523614
```

**Note:** If username is "admin", role will be automatically set to "admin"

---

### 2. **POST /auth/verify**
Verify OTP and receive JWT token.

**Request:**
```json
POST http://localhost:4000/auth/verify
Content-Type: application/json

{
  "username": "testuser",
  "otp": "523614"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Invalid OTP):**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Console Output:**
```
✅ JWT issued for user: testuser with role: user
```

---

### 3. **GET /auth/profile** (Protected)
Get authenticated user's profile information.

**Request:**
```bash
GET http://localhost:4000/auth/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Success):**
```json
{
  "success": true,
  "message": "✅ User profile",
  "user": "testuser",
  "role": "user"
}
```

**Response (No Token):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Console Output:**
```
✅ Token verified for user: testuser role: user
```

---

### 4. **GET /auth/admin** (Protected - Admin Only)
Access admin-only endpoint. Only users with "admin" role can access.

**Request:**
```bash
GET http://localhost:4000/auth/admin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Admin Access):**
```json
{
  "success": true,
  "message": "✅ Welcome Admin!",
  "user": "admin",
  "role": "admin"
}
```

**Response (Normal User - Denied):**
```json
{
  "success": false,
  "message": "Access denied. Admin only."
}
```

**Console Output (Admin):**
```
✅ Token verified for user: admin role: admin
✅ Admin access granted for user: admin
```

**Console Output (Normal User):**
```
✅ Token verified for user: testuser role: user
❌ Access denied for user: testuser role: user
```

---

## Testing Guide

### Option 1: Using Frontend (Browser)

1. Start containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

2. Open browser: `http://localhost:3000`

3. **Test Normal User Flow:**
   - Username: `testuser`
   - Click "Send OTP"
   - Check terminal for OTP (e.g., `523614`)
   - Enter OTP, click "Verify OTP"
   - Click "Get My Profile" (✅ Success)
   - Click "Access Admin Panel" (❌ Access denied)

4. **Test Admin User Flow:**
   - Username: `admin`
   - Click "Send OTP"
   - Check terminal for OTP
   - Enter OTP, click "Verify OTP"
   - Click "Get My Profile" (✅ Success)
   - Click "Access Admin Panel" (✅ Admin Welcome)

---

### Option 2: Using cURL (Command Line)

#### Step 1: Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin"}'
```

**Output:**
```
{"success":true,"message":"OTP sent (check terminal)"}
```

Check terminal for OTP (e.g., `845923`)

#### Step 2: Verify OTP
```bash
curl -X POST http://localhost:4000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "otp": "845923"}'
```

**Output:**
```
{"success":true,"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}
```

Save the token for next requests.

#### Step 3: Get Profile (with Token)
```bash
TOKEN="your_token_here"

curl -X GET http://localhost:4000/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

**Output:**
```
{"success":true,"message":"✅ User profile","user":"admin","role":"admin"}
```

#### Step 4: Access Admin Route
```bash
TOKEN="your_token_here"

curl -X GET http://localhost:4000/auth/admin \
  -H "Authorization: Bearer $TOKEN"
```

**Output (if admin):**
```
{"success":true,"message":"✅ Welcome Admin!","user":"admin","role":"admin"}
```

**Output (if normal user):**
```
{"success":false,"message":"Access denied. Admin only."}
```

---

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  username: String,       // Unique username
  otp: String,            // Current OTP (6 digits)
  role: String            // "user" or "admin" (default: "user")
}
```

---

## JWT Token Structure

The JWT token contains:

```javascript
{
  username: "testuser",
  role: "user",
  iat: 1682000000,        // Issued at
  exp: 1682003600         // Expires in 1 hour
}
```

---

## Role Assignment Rules

| Username | Default Role |
|----------|--------------|
| `admin`  | `admin`      |
| Any other username | `user` |

---

## Error Handling

### Common Errors

| Status | Error Message | Reason |
|--------|---------------|--------|
| 400 | Username required | Username not provided in login |
| 400 | Username and OTP required | Missing fields in verify |
| 401 | No token provided | Authorization header missing |
| 401 | Invalid OTP | OTP doesn't match database |
| 403 | Invalid token | Token is expired or corrupted |
| 403 | Access denied. Admin only. | User role is not "admin" |
| 404 | User not found | Username not in database |
| 500 | Server error | Database or internal error |

---

## Middleware Explained

### `verifyToken` Middleware
- Checks `Authorization` header for token
- Extracts token from `Bearer <token>` format
- Verifies JWT signature and expiration
- Adds user data to `req.user`
- Used on: `/auth/profile`, `/auth/admin`

### `requireAdmin` Middleware
- Checks if user's role is "admin"
- Returns 403 if role is not "admin"
- Used on: `/auth/admin`

---

## Docker Notes

No Docker changes needed. All services configured and running:

- **Auth Service:** Port 4001 (inside container)
- **User Service:** Port 4002 (inside container)
- **API Gateway:** Port 4000 (routes to services)
- **Frontend:** Port 3000 (nginx)
- **MongoDB:** Port 27017 (internal, no external access needed)

---

## Security Notes (Production)

⚠️ **Current Setup (Development Only)**

- JWT secret is hardcoded ("secretkey")
- OTP sent to console, not email
- No rate limiting
- No HTTPS
- No password hashing

**For Production:**
- Use environment variables for secrets
- Implement email/SMS OTP delivery
- Add rate limiting and request validation
- Use HTTPS only
- Hash OTP before storing
- Add proper logging and monitoring

---

## Summary

| Feature | Status |
|---------|--------|
| User Registration | ✅ |
| OTP Generation | ✅ |
| OTP Verification | ✅ |
| JWT Token Creation | ✅ |
| Token Verification | ✅ |
| Role-Based Access | ✅ |
| Admin Routes | ✅ |
| Error Handling | ✅ |
| Logging | ✅ |
| Docker Support | ✅ |
