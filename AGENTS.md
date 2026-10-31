<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project conventions

## Limits and durations live in `src/lib/constants.ts`

App-wide limits (list sizes, text lengths, page sizes, password rules) and durations (cache times, expiry windows, session length) are defined once in `src/lib/constants.ts`, in the `LIMITS` and `DURATIONS` objects.

- Before adding a number like this, check `constants.ts`; reuse an existing value instead of writing the number again.
- A new limit or duration goes into `constants.ts` with a short descriptive name (e.g. `avoidedIngredients`, not `max2`), then is imported where it's used.
- Use the same constant on the client and the server, e.g. both an input's `maxLength` and the zod `.max()` that checks it.
- Text shown to users that mentions a limit uses the constant too (`` `At least ${LIMITS.passwordMinLength} characters.` ``).
- Keep `constants.ts` free of `import "server-only"` and of imports from other app files, so client components can use it.
- Not for: UI option lists (e.g. the expiry shortcut buttons), Tailwind sizes, or secrets and URLs, which belong in `.env`.
