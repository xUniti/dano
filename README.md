# DANO

A local-first **Life OS** — calendar, tasks, notes, habits and more — built to be
fast, private, and usable by **everyone**. Accessibility isn't a feature here; it's
the goal of every screen.

- **Local-first** like Anytype — your data lives on your device and works offline.
- **Everywhere** — desktop and mobile from one codebase (web possible later).
- **Calm & compact** — a warm, dense, tidy interface with a single sage accent,
  adjustable density, theme, contrast, text size, and reading aids.

## Stack

- [SvelteKit 5](https://svelte.dev) (runes, TypeScript) + [Vite](https://vite.dev)
- [Tauri 2](https://tauri.app) for the desktop & mobile shells
- Local SQLite (added with the data layer)
- [Lucide](https://lucide.dev) icons

## Develop

```sh
npm install
npm run dev        # web preview at http://localhost:1420
npm run tauri:dev  # run the desktop app (compiles the Rust shell)
```

Useful routes while building:

- `/calendar` — the app's home
- `/settings` — appearance & accessibility controls
- `/dev/ui` — the design system (tokens + components)

## Status

Early. **Phase 0** (scaffold + design system) is in place; the **Calendar** is the
first feature being built. Features land one at a time: Calendar → Persona → Tasks →
Notes → Projects → Areas → Archive → Habits → Dashboard → Settings → Search →
Notifications.
