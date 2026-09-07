# Contributing to Erlbrew Cafe Website

Thank you for considering contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/erlbrewcafewebsite.git
   cd erlbrewcafewebsite
   ```
3. Install dependencies:
   ```bash
   cd server && npm install
   ```
4. Create a branch for your changes:
   ```bash
   git checkout -b feat/your-feature
   ```

## Development

1. Copy `.env.example` to `.env` and fill in your database credentials
2. Initialize the database: `mysql -u root -p < server/init.sql`
3. Start the server: `cd server && npm start`
4. Open `erlbrew-cafe-website.html` in your browser for the public site
5. Access the admin panel at `/admin` (requires Cloudflare Zero Trust or local session)

## Making Changes

- Keep changes focused — one feature or fix per PR
- Follow existing code style (no linter configured, but stay consistent)
- Test your changes manually in both the public site and admin panel
- Write clear commit messages describing what changed and why

## Pull Requests

1. Push your branch to your fork
2. Open a PR against `main`
3. Fill in the PR template
4. Describe what you changed and why
5. Reference any related issues (e.g., `Closes #12`)

## Reporting Issues

- Use the issue templates when available
- Include steps to reproduce for bugs
- Include screenshots for UI changes

## Code Style

- **HTML**: Semantic, accessible markup
- **CSS**: Inline `<style>` blocks in HTML files, consistent naming (BEM-like)
- **JavaScript**: Vanilla JS, no frameworks. Use `async/await` for API calls
- **Node.js**: CommonJS modules, Express.js patterns, parameterized SQL queries

## Security

If you discover a security vulnerability, please report it privately via
[GitHub's security advisory](https://github.com/ctoswar/erlbrewcafewebsite/security/advisories/new)
rather than opening a public issue.
