# Contributing to QingLu

Thank you for your interest in contributing to QingLu (轻鹭).

## Development setup

```powershell
npm run install:all
npm run dev
```

Or use `.\scripts\start.ps1` on Windows.

- Frontend env: copy `frontend/.env.example` to `frontend/.env.local`
- Backend env: copy `backend/.env.example` to `backend/.env`

See the root [`.env.example`](.env.example) for Vercel deployment variables.

## Project layout

| Directory | Purpose |
|-----------|---------|
| `frontend/` | React + Vite SPA |
| `backend/` | Express account API + SQLite |
| `Agent/burnpal_skill/` | OpenClaw Skill modules (vendor) |
| `api/` / `lib/` | Vercel serverless + edge proxy |

## Before submitting a PR

1. Run `npm run lint --prefix frontend`
2. Run `npm run build --prefix frontend`
3. Run `npm run build --prefix backend`
4. Keep changes focused; match existing code style
5. Update i18n keys in all locales under `frontend/src/lib/i18n/locales/` when adding UI strings

## Skill bundle

When editing files under `Agent/burnpal_skill/`, regenerate frontend bundles:

```bash
npm run bundle:skill --prefix frontend
```

## Third-party code

`Agent/burnpal_skill/` is vendored from [CCLYX/burnpal.skill](https://github.com/CCLYX/burnpal.skill). Preserve upstream attribution when modifying skill assets.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
