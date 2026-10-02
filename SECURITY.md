# Security policy

This project handles information about children, so security and privacy reports are taken seriously.

## Reporting a vulnerability

**Please do not open a public issue.**

1. Use GitHub's private reporting: on the repository page choose _Security_, then _Report a vulnerability_.
2. If that is not available, email scottjones@alicesystems.co.uk with the subject "LittleProgress security". Do not include real personal data in the report.

Please include what you found, how to reproduce it, and what you think the impact is. You will get a reply within a few days. Fixes are made privately first and announced once they are available. Credit is given if you want it.

## What counts

- Anything that could expose another family's data, or let someone sign in as someone else.
- Weaknesses in sign-in, sessions, the carer PIN, passkeys, or two-factor.
- Secrets, keys, or real personal data found in the repository or its history. Please report these privately; they need to be rotated.
- Vulnerable dependencies that are actually reachable in our code.

## Out of scope

Reports that only say a dependency has an advisory, when it is build tooling and not reachable (the accepted ones are listed in `osv-scanner.toml` with reasons), missing best-practice headers on a local development server, and social engineering.

## Supported versions

The project is under development; only the `main` branch is supported.
