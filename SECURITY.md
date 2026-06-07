# Security Policy

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.

Email the maintainers with:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment (if known)

We will acknowledge receipt and work on a fix as soon as possible.

## Scope

This policy covers the QingLu application code in this repository (frontend, backend, API proxies). Third-party services (Alibaba DashScope, Resend, Vercel, Render) are governed by their own policies.

## Secrets

Never commit `.env`, API keys, or JWT secrets. Use the provided `.env.example` files as templates only.
