# Production dependency security review — 2026-10-30

## Reproduced findings

GitHub Dependabot originally identified two `@grpc/grpc-js` advisories (one high, one low). The lockfile resolved `@grpc/grpc-js@1.9.16` via `firebase@12.19.0` -> `@firebase/firestore@4.17.2`. The latter declares `~1.9.0`, so a simple transitive `npm update` cannot select the patched 1.13.6+ release.

The security branch explicitly uses `overrides: { "@grpc/grpc-js": "^1.14.7" }`, with `@grpc/grpc-js@1.14.7` in package-lock.json. This intentionally exceeds the older Firestore dependency declaration. **The Firestore read/write/delete test now passes in a local Firebase emulator with a `demo-` project.** Keep the PR in draft pending normal review and additional production-specific compatibility checks (security rules, auth, full workflows).

`npm audit fix --package-lock-only` also updated `body-parser@1.20.9`, `qs@6.16.2`, and `re2js@2.9.1` to resolve additional registry advisories while preserving top-level dependency constraints.

## Verification

```bash
npm ci
npm ls @grpc/grpc-js --all
npm audit --omit=dev --audit-level=high
npm run lint
npm run build
# Requires Java 21 and Firebase CLI 15.32.1:
npm run test:firestore:emulator
```

- The npm registry audit returned 0 vulnerabilities in the entire dependency tree after the lockfile updates.
- TypeScript/build and Firebase module initialization passed. A local Firestore emulator test also passed create/read/delete using the patched gRPC dependency, without touching any real cloud resource.
- The existing GitHub Actions workflow now audits production dependencies for high/critical advisories and runs the same Firestore emulator integration check on Java 21.

## Limitations

Npm audit only matches registered vulnerability advisories; 0 reported vulnerabilities is not a formal security certification. Do not silently remove the override until a compatible Firebase/Firestore release with a patched gRPC constraint is confirmed. Do not merge automatically.
