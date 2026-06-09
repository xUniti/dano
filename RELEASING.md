# Releasing DANO

Releases are automated by **release-please**. You don't bump versions or create tags by hand.

## The flow

1. **Commit with conventional-commit messages** (you already do this):
   - `feat: …` → next release bumps **MINOR** (`0.2.0 → 0.3.0`)
   - `fix: …` → bumps **PATCH** (`0.2.0 → 0.2.1`)
   - `feat!:` or a `BREAKING CHANGE:` footer → bumps **MAJOR** (after 1.0.0)
   - `chore:`, `docs:`, `ci:`, `refactor:` → no release on their own
2. Push to `main`. release-please opens (or updates) a **Release PR** titled like
   `chore(main): release 0.3.0`. It bumps the version in `package.json`,
   `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and updates `CHANGELOG.md`.
3. **Merge the Release PR** when you're ready to ship. That creates the GitHub Release + tag,
   then the `build` job compiles installers for Linux/Windows/macOS and attaches them.

That's it — **merging the PR is the release.**

## One-time setup on GitHub

- **Settings → Actions → General → Workflow permissions → "Read and write permissions"** (so the
  bot can open PRs and create releases). Also tick **"Allow GitHub Actions to create and approve
  pull requests"**.

## Notes

- `Cargo.lock` isn't bumped by release-please; `cargo build` refreshes it during the release
  build (the build doesn't use `--locked`), so this is harmless. Run `cargo check` locally
  whenever you want the committed lock to match.
- Manual fallback (rarely needed): bump the three version files yourself, then
  `git tag vX.Y.Z && git push origin vX.Y.Z` — but prefer the release-please flow.
- Builds are unsigned, so Windows/macOS show a one-time "unknown developer" warning (documented
  in the README). Real signing + auto-update need paid certs — deferred.
