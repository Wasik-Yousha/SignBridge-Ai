# Contributing

## Branching

- Create a feature branch from `main`.
- Use clear branch names such as `feature/mixamo-calibration` or `fix/avatar-loading`.

## Commit Messages

Use short, descriptive commit messages. Example:

- `feat: add wrist palm presets`
- `fix: handle missing bones gracefully`

## Pull Requests

1. Keep PRs focused on one change set.
2. Link related issues.
3. Include testing notes.
4. Ensure CI passes before requesting review.

## Local Checks

Run before opening a PR:

```bash
npm run lint
npm run build
```

## Coding Guidelines

- Use plain JavaScript (no TypeScript in this repository).
- Keep exported APIs documented with short JSDoc comments.
- Route all avatar bone lookups through `src/avatar/boneMap.js`.
