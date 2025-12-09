# Product Review Platform - Vulnerable Web Application

A modern, full-featured web application intentionally built with security vulnerabilities for application security testing and practice.

## Application Features

- User registration and authentication
- Product browsing and search
- Review submission with ratings (1-5 stars)
- Image upload for reviews
- User profile management
- Admin dashboard for user and review management
- RESTful API architecture
- Modern responsive UI

## Quick Start

The application is currently running at:
**http://localhost:3000**

### Default Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Regular User Account:**
- Username: `johndoe`
- Password: `password123`

## Technology Stack

- **Backend:** Node.js + Express
- **Database:** SQLite3
- **Authentication:** JWT (JSON Web Tokens)
- **Frontend:** Vanilla JavaScript + HTML5 + CSS3
- **File Upload:** Multer

## Application Structure

```
/tmp/vulnerable-app/
├── backend/
│   ├── server.js          # Main Express server with API endpoints
│   └── database.js        # SQLite database initialization
├── frontend/
│   ├── index.html         # Main UI
│   ├── app.js            # Frontend logic
│   └── styles.css        # Styling
├── uploads/              # User-uploaded files
├── package.json          # Dependencies
├── Security.md          # Vulnerability documentation
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `GET /api/products/:id/reviews` - Get product reviews
- `GET /api/search?q=term` - Search products

### Reviews
- `POST /api/reviews` - Submit review (authenticated)
- `DELETE /api/reviews/:id` - Delete review (authenticated)
- `GET /api/export/reviews` - Export reviews (authenticated)

### Users
- `GET /api/users/:id` - Get user profile
- `PUT /api/users/:id` - Update user profile (authenticated)

### Admin
- `GET /api/admin/users` - List all users (authenticated)
- `GET /api/admin/reviews` - List all reviews (authenticated)

### Utilities
- `GET /api/file?path=` - Read file from server

## Testing Instructions

1. Access the web UI at http://localhost:3000
2. Browse the application as a guest
3. Register a new account or login with default credentials
4. Explore different features and functionalities
5. Use security testing tools and techniques to identify vulnerabilities
6. Refer to Security.md for the complete list of vulnerabilities (only after you've attempted to find them yourself)

## Security Testing Scope

This application contains 20+ intentional security vulnerabilities including:
- SQL Injection
- Cross-Site Scripting (XSS)
- Insecure Direct Object References (IDOR)
- Authentication & Authorization issues
- File upload vulnerabilities
- Path traversal
- And many more...

## Important Notes

- This application is for educational purposes ONLY
- Do NOT deploy this application in any production environment
- Do NOT expose this application to public networks
- All vulnerabilities are intentional for learning purposes
- Refer to Security.md for the complete vulnerability list after testing

## Stopping the Server

To stop the server, use:
```bash
pkill -f "node backend/server.js"
```

## Restarting the Application

```bash
cd /tmp/vulnerable-app
npm start
```

Good luck with your security testing practice!
