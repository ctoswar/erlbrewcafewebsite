# Contributing

Thank you for your interest in contributing to Erlbrew Cafe! This guide will help you get started.

---

## Getting Started

### 1. Fork the Repository

Click the "Fork" button at the top right of the [repository page](https://github.com/ctoswar/erlbrewcafewebsite).

### 2. Clone Your Fork

```bash
git clone https://github.com/your-username/erlbrewcafewebsite.git
cd erlbrewcafewebsite
```

### 3. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/add-inventory-management`
- `fix/gallery-upload-bug`
- `docs/update-api-reference`

---

## Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8+
- Docker (optional)

### Install Dependencies

```bash
cd server
npm install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### Initialize Database

```bash
mysql -h localhost -u root -p < server/init.sql
```

### Start Development Server

```bash
cd server
npm run dev
```

The server will start with file watching enabled.

---

## Project Structure

```
erlbrewcafewebsite/
├── server/
│   ├── routes/           # API route handlers
│   ├── middleware/        # Express middleware
│   ├── bin/              # Utility scripts
│   ├── server.js         # Main server file
│   └── db.js             # Database connection
├── erlbrew-cafe-website.html  # Public website
├── erlbrew-admin.html         # Admin panel
└── wiki/                      # Project documentation
```

---

## Coding Standards

### JavaScript Style

- Use consistent 2-space indentation
- Single quotes for strings
- Semicolons required
- Use `const` and `let`, avoid `var`
- Descriptive variable/function names

### Example

```javascript
// Good
async function getMenuItems(categoryId) {
  const pool = db.getPool();
  const [rows] = await pool.execute(
    'SELECT * FROM menu_items WHERE category_id = ?',
    [categoryId]
  );
  return rows;
}

// Bad
async function g(ci) {
  const p = db.getPool();
  const [r] = await p.execute('SELECT * FROM menu_items WHERE category_id = ?', [ci]);
  return r;
}
```

### API Response Format

Always use consistent response format:

```javascript
// Success
res.json({ success: true, data: result });

// Error
res.status(400).json({ success: false, message: 'Error description' });
```

---

## Making Changes

### 1. Write Code

Follow existing patterns in the codebase.

### 2. Test Your Changes

- Test API endpoints manually or with Postman
- Verify admin panel functionality
- Check error handling

### 3. Update Documentation

If adding new features:
- Update API Reference wiki page
- Add comments to complex code
- Update README if needed

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add inventory management endpoint"
```

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Description |
|--------|-------------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation |
| `style:` | Code style (formatting, etc.) |
| `refactor:` | Code refactoring |
| `test:` | Adding tests |
| `chore:` | Maintenance tasks |

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to the original repository
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template
5. Submit the pull request

---

## Pull Request Guidelines

### PR Title

Use the same conventional commit format:

```
feat: add inventory management endpoint
fix: resolve gallery upload race condition
docs: update API reference for menu endpoints
```

### PR Description

Include:
- **Summary**: Brief description of changes
- **Motivation**: Why this change is needed
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes (optional)

### PR Checklist

- [ ] Code follows project style
- [ ] Changes are tested
- [ ] Documentation is updated
- [ ] No console.log statements left
- [ ] No hardcoded credentials
- [ ] Error handling is proper

---

## Reporting Issues

### Bug Reports

Use the [Bug Report template](https://github.com/ctoswar/erlbrewcafewebsite/issues/new?template=bug_report.md):

- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Environment details

### Feature Requests

Use the [Feature Request template](https://github.com/ctoswar/erlbrewcafewebsite/issues/new?template=feature_request.md):

- Problem description
- Proposed solution
- Alternatives considered
- Additional context

---

## Code of Conduct

Please read our [Code of Conduct](../CODE_OF_CONDUCT.md) before contributing.

---

## Questions?

- Open an [issue](https://github.com/ctoswar/erlbrewcafewebsite/issues)
- Start a [discussion](https://github.com/ctoswar/erlbrewcafewebsite/discussions)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](../LICENSE).
