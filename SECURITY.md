# Security

If you believe you have found a security vulnerability in this project, **do not** open a public GitHub issue.

Please report it responsibly by contacting the repository owner (e.g. via GitHub profile contact or a private advisory if enabled). Include enough detail to reproduce the issue without exposing live secrets or production data.

Production deployments must supply the required runtime configuration described
in `.env.example`, apply database migrations before starting the application,
and operate with dependency monitoring, centralized logs, backups, and alerting.
