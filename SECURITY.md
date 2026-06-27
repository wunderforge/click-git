# Security Policy

## Supported Versions

Click Git is pre-1.0. Security fixes target the latest published version.

## Reporting A Vulnerability

Please report security issues privately by opening a GitHub security advisory on the repository, or by contacting the maintainers through the repository owner.

Do not include secrets, private repository URLs, access tokens, or sensitive file contents in public issues.

## Security Model

Click Git runs explicit local Git commands selected by the user. It requires VS Code workspace trust and does not install Git hooks, change repository configuration, or read secret-bearing files as part of normal operation.
