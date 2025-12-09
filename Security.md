# Security Vulnerabilities Documentation

This document lists all intentional security vulnerabilities present in this application for educational and testing purposes.

## Critical Vulnerabilities

### 1. SQL Injection (Multiple Locations)
**Severity:** Critical
**Locations:**
- `POST /api/register` - backend/server.js:61
- `POST /api/login` - backend/server.js:76
- `GET /api/products/:id` - backend/server.js:109
- `GET /api/products/:id/reviews` - backend/server.js:123
- `POST /api/reviews` - backend/server.js:138
- `GET /api/users/:id` - backend/server.js:154
- `PUT /api/users/:id` - backend/server.js:168
- `DELETE /api/reviews/:id` - backend/server.js:178
- `GET /api/search` - backend/server.js:212
- `GET /api/export/reviews` - backend/server.js:240

**Description:** User input is directly concatenated into SQL queries without parameterization or sanitization, allowing SQL injection attacks.

**Impact:** Complete database compromise, authentication bypass, data exfiltration, data manipulation.

---

### 2. Cross-Site Scripting (XSS)
**Severity:** High
**Locations:**
- Review display - frontend/app.js:215-223
- Product search results - frontend/app.js:259-266
- User profile display - frontend/app.js:277-282
- Admin dashboard - frontend/app.js:309-324, 341-356

**Description:** User-generated content (reviews, usernames, product descriptions) is rendered without sanitization, allowing stored XSS attacks.

**Impact:** Session hijacking, credential theft, malicious actions on behalf of users.

---

### 3. Insecure Direct Object Reference (IDOR)
**Severity:** High
**Locations:**
- `GET /api/users/:id` - backend/server.js:150
- `PUT /api/users/:id` - backend/server.js:164
- `DELETE /api/reviews/:id` - backend/server.js:174
- `GET /api/export/reviews` - backend/server.js:228

**Description:** No authorization checks to verify if the authenticated user has permission to access or modify the requested resource.

**Impact:** Unauthorized access to other users' data, privilege escalation, unauthorized data modification.

---

### 4. Hardcoded JWT Secret
**Severity:** Critical
**Location:** backend/server.js:14

**Description:** JWT secret key is hardcoded as 'super_secret_key_12345' instead of using environment variables.

**Impact:** Anyone can forge valid JWT tokens, complete authentication bypass.

---

### 5. Path Traversal
**Severity:** Critical
**Location:** `GET /api/file` - backend/server.js:220

**Description:** File path parameter is used directly without validation, allowing access to arbitrary files on the server.

**Impact:** Reading sensitive files like /etc/passwd, application source code, credentials, database files.

---

### 6. Unrestricted File Upload
**Severity:** High
**Location:** `POST /api/reviews` - backend/server.js:133

**Description:** No validation on uploaded file types, size, or content. Files are stored with predictable names.

**Impact:** Server-side code execution, disk space exhaustion, malware distribution.

---

## High Vulnerabilities

### 7. Missing Authorization Checks
**Severity:** High
**Locations:**
- `GET /api/admin/users` - backend/server.js:186
- `GET /api/admin/reviews` - backend/server.js:198

**Description:** Admin endpoints only check for JWT presence, not for admin role.

**Impact:** Any authenticated user can access admin functionality.

---

### 8. Mass Assignment
**Severity:** High
**Location:** `PUT /api/users/:id` - backend/server.js:164

**Description:** All fields from request body are directly used in UPDATE query, allowing modification of unintended fields like role.

**Impact:** Privilege escalation by modifying role field.

---

### 9. CORS Misconfiguration
**Severity:** Medium-High
**Location:** backend/server.js:17-21

**Description:** CORS configured with wildcard origin '*' and credentials enabled.

**Impact:** Any website can make authenticated requests to the API.

---

### 10. Information Disclosure
**Severity:** Medium
**Locations:** Multiple error messages throughout backend/server.js

**Description:** Detailed error messages including SQL errors and stack traces are sent to clients.

**Impact:** Database structure disclosure, technology stack fingerprinting.

---

## Medium Vulnerabilities

### 11. No Rate Limiting
**Severity:** Medium
**Locations:** All endpoints

**Description:** No rate limiting on any endpoint, especially authentication endpoints.

**Impact:** Brute force attacks, denial of service, credential stuffing.

---

### 12. Weak Password Policy
**Severity:** Medium
**Location:** `POST /api/register` - backend/server.js:48

**Description:** No password complexity requirements or length validation.

**Impact:** Weak passwords, easier brute force attacks.

---

### 13. JWT Without Expiration
**Severity:** Medium
**Location:** backend/server.js:95-99

**Description:** JWT tokens are generated without expiration time.

**Impact:** Stolen tokens remain valid indefinitely.

---

### 14. Sensitive Data in JWT
**Severity:** Low-Medium
**Location:** backend/server.js:95-99

**Description:** User role included in JWT payload which can be read by anyone.

**Impact:** Information disclosure, potential for client-side role manipulation attempts.

---

### 15. No HTTPS Enforcement
**Severity:** Medium
**Location:** Application configuration

**Description:** Application runs on HTTP without HTTPS enforcement.

**Impact:** Man-in-the-middle attacks, credential interception.

---

### 16. No CSRF Protection
**Severity:** Medium
**Locations:** All state-changing endpoints

**Description:** No CSRF tokens or same-site cookie attributes.

**Impact:** Cross-site request forgery attacks.

---

### 17. Predictable Resource IDs
**Severity:** Low-Medium
**Location:** Database schema - backend/database.js

**Description:** Sequential integer IDs for all resources.

**Impact:** Easier enumeration of resources, aids in IDOR exploitation.

---

### 18. Client-Side Authentication State
**Severity:** Low-Medium
**Location:** frontend/app.js:362-370

**Description:** User authentication state parsed from JWT on client-side without server validation.

**Impact:** Can be manipulated to show admin UI (though backend should still validate).

---

### 19. Database Credentials in Default Location
**Severity:** Low
**Location:** backend/database.js:6

**Description:** SQLite database stored in predictable default location.

**Impact:** Easy to locate and attempt to extract if path traversal works.

---

### 20. No Input Length Validation
**Severity:** Low-Medium
**Locations:** All input endpoints

**Description:** No maximum length validation on string inputs.

**Impact:** Buffer overflow attempts, denial of service.

---

## Testing Credentials

**Admin Account:**
- Username: admin
- Password: admin123

**Regular User Account:**
- Username: johndoe
- Password: password123

## Exploitation Tips

1. Start with SQL injection in login to bypass authentication
2. Use IDOR to access other users' profiles and data
3. Exploit mass assignment to escalate privileges to admin
4. Use XSS in reviews to steal admin session tokens
5. Path traversal to read sensitive files
6. Upload malicious files through review image upload
7. Access admin endpoints without proper authorization
8. Forge JWT tokens using the hardcoded secret

## Safe Testing Reminder

This application is intentionally vulnerable for educational purposes only. Do not deploy this application in any production or publicly accessible environment.
