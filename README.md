# DANO

> A local-first **PARA** workspace — notes, tasks, projects, a light CRM, and a calendar.
> By [xUniti](https://xuniti.com).

DANO is a personal "second brain" built on Tiago Forte's PARA method (Projects,
Areas, Resources, Archive — plus an Inbox for quick capture). It runs fully
offline and stores everything on your own device.

## Stack

- **Tauri v2** — lightweight desktop shell (and mobile later)
- **Svelte 5** + **SvelteKit** (SPA mode)
- **SQLite** via `tauri-plugin-sql` — native, reliable local storage
- **CodeMirror 6** — Markdown editor

> CRDT-based sync (offline-first, end-to-end encrypted) is planned for a later
> phase. v0.1 focuses on a fast, reliable local experience.

## Develop

Requires Rust, Node, and the Tauri Linux prerequisites (on Arch:
`webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libappindicator-gtk3 librsvg xdotool`).

```bash
npm install
npm run tauri dev
```

## Status

**v0.1** — Notes (Markdown) organized into PARA containers, stored locally.
See the project plan for the full roadmap.

## License

MIT © xUniti
