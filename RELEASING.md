# Releasing DANO

Pushing a version tag (`vX.Y.Z`) triggers `.github/workflows/release.yml`, which builds
installers for Linux, Windows and macOS and publishes a GitHub Release with them attached.

## 1. Bump the version in ALL THREE files (must match)

| File | Field |
|------|-------|
| `package.json` | `"version"` |
| `src-tauri/tauri.conf.json` | `"version"` ← this one becomes the app/installer version |
| `src-tauri/Cargo.toml` | `version` (the `dano` package) |

SemVer while pre-1.0: `feat` → bump MINOR (`0.1.0 → 0.2.0`), `fix` → bump PATCH (`0.2.0 → 0.2.1`).

## 2. Commit, tag, push

```bash
npm run check            # make sure it's green first
git add -A && git commit -m "chore(release): v0.2.0"
git tag v0.2.0
git push && git push --tags
```

## 3. Watch it build

GitHub → **Actions** tab → the `release` run (3 jobs, ~5–15 min). When done, the Release
appears under **Releases** with the installers attached, already published.

## Notes

- The tag (`v0.2.0`) must match the version. Push the tag **after** committing the bump.
- Unsigned builds warn on first launch (Windows SmartScreen, macOS Gatekeeper). Not a blocker;
  documented in the README. Real signing + auto-update need paid certs — deferred.
- To undo a bad release: delete the tag (`git push --delete origin v0.2.0`) and the Release
  in the GitHub UI, then re-tag.
