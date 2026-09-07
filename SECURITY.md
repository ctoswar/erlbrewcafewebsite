# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| main    | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it
responsibly. **Do not open a public GitHub issue.**

Instead, please use
[GitHub's private vulnerability reporting](https://github.com/ctoswar/erlbrewcafewebsite/security/advisories/new)
to submit your findings.

You should receive a response within 48 hours. If the vulnerability is confirmed,
a fix will be prioritized and released as soon as possible.

## Security Measures

This project implements the following security measures:

- **Cloudflare Zero Trust** — Admin panel (`/admin`) is protected by access policies
- **Session-based authentication** — In-memory sessions with configurable TTL
- **Helmet** — HTTP security headers
- **CORS** — Configurable allowed origins
- **Rate limiting** — Applied to login endpoint
- **Input validation** — Server-side parameterized SQL queries (no raw interpolation)
- **File upload limits** — Type and size restrictions on all upload endpoints

## Scope

Security issues may apply to:

- The Express.js server (`server/`)
- API endpoints and authentication middleware
- File upload handling
- Database queries

The static HTML frontend files (`erlbrew-cafe-website.html`, `erlbrew-admin.html`)
are served as-is and do not process sensitive data directly.
