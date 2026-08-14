# Contributing to PollWave

Thank you for your interest in contributing to PollWave! 🎉

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Install dependencies**:
   ```bash
   npm run install:all
   ```
5. **Make your changes** and test them locally
6. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add poll scheduling feature"
   ```
7. **Push** and open a **Pull Request**

## Branching Strategy

| Branch     | Purpose                        |
|------------|--------------------------------|
| `main`     | Production-ready code          |
| `develop`  | Integration branch for features|
| `feature/*`| New features                   |
| `fix/*`    | Bug fixes                      |
| `hotfix/*` | Urgent production fixes        |

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `style:` — Formatting (no code change)
- `refactor:` — Code change that neither fixes a bug nor adds a feature
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

## Code Standards

- **Frontend**: React functional components with hooks
- **Backend**: Express routes with async/await error handling
- **CSS**: Use the existing design tokens (CSS variables)
- **No inline secrets**: Use `.env` files (never commit them)

## Pull Request Guidelines

1. Fill out the PR template completely
2. Ensure CI passes (frontend builds, backend validates)
3. Include screenshots for UI changes
4. Keep PRs focused — one feature per PR
5. Update documentation if needed

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots if applicable

## Need Help?

Open a [Discussion](https://github.com/YOUR_USERNAME/poll-platform/discussions) or reach out to the maintainers.
