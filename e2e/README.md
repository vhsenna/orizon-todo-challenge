# End-To-End Tests

Selenium tests run against already-started services.

Default URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

Run:

```bash
cd backend
uv run pytest ../e2e -q
```

Override URLs when needed:

```bash
E2E_FRONTEND_URL=http://localhost:5173 E2E_BACKEND_URL=http://localhost:8000 uv run pytest ../e2e -q
```
