# Verified build / incremental performance work (2026-10-30)

## Source of truth

This change is based on GitHub `main` at `ac6adff` (not on the older Windows checkout at `d6ffa85`). The older checkout reproduces an `npm ERESOLVE` conflict because it requests `esbuild ^0.25.0` with Vite 8. The current GitHub main already contains the dependency fix (`esbuild ^0.28.2`) and a `package-lock.json`: **do not downgrade the current repo**.

## Commands

```sh
npm ci
npm run test:invariants
npm run lint
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

## Improvements in this branch

- Six optional UI panels now load via dynamic imports only on opening. `React.Suspense` boundaries preserve the standard API of each panel.
- Vite alias resolves from `import.meta.dirname`, avoiding the Vite 8 native-config warning for the ESM project.
- Eight built-in Node tests cover the npm manifest/lockfile constraint, ESM config, and all six lazy loading boundaries. These are source-level contract tests, **not browser integration tests**.
- Existing GitHub Actions `.github/workflows/webpack.yml` already invokes the invariant script when available; this branch makes it real.

## Baseline and candidate build (Linux WSL2, Node 22.23.4, Vite 8.3.4)

| Measure | Baseline main | Candidate | Notes |
| --- | ---: | ---: | --- |
| Largest initial JS chunk, minified | 1,777.53 kB | 1,723.12 kB | 3.1% smaller |
| Largest initial JS chunk, gzip | 492.11 kB | 478.96 kB | ~2.7% smaller |
| On-demand chunks | 0 | 6 panels + small shared chunks | Loaded when opened |
| TypeScript + Vite build | PASS | PASS | Actual WSL builds |

This is a **small but verified reduction**, not proof of faster FPS or a complete performance audit. The large entry chunk remains; target it with measured profiling and game-engine-level optimization, ideally on Android GPU hardware.

## Known limitations

- Build validation is not equivalent to browser interaction checks, 3D GPU testing, phone APK packaging, or deployed API availability.
- The API plugin in `vite.config.ts` runs in the Vite development server; a production `vite preview` is not a deployment of those API routes. Provide an explicitly hosted, authenticated backend for production.
- Optional AI and Google services require their own authorization and account-side configuration. No credentials are committed.
- This branch does not modify local Windows sources, production services, default branches, or the separately maintained Unity project.
