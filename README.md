<div align="center">

<img src="https://raw.githubusercontent.com/xUniti/dano/main/static/dano-logo.svg" alt="DANO logo" width="120" height="120" />

# DANO

### A local-first PARA workspace — notes, tasks, projects, a light CRM, and a calendar, all on your own device.

DANO is a free, open-source, offline-first "second brain" desktop app that organizes your work and life with the **PARA method** (Projects · Areas · Resources · Archive). No accounts, no cloud, no tracking — your data stays in a local SQLite file you fully own.

[![Release](https://img.shields.io/github/v/release/xUniti/dano?include_prereleases&label=download&style=flat-square)](https://github.com/xUniti/dano/releases)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri%20v2-24C8DB?style=flat-square)](https://tauri.app)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey?style=flat-square)

[**Download**](#download) · [Features](#features) · [Screenshots](#screenshots) · [Build from source](#build-from-source)

</div>

---

## What is DANO?

DANO is a **privacy-first productivity app** that unifies the tools you normally juggle across five apps — a note-taking app, a to-do list, a project tracker, a contacts/CRM, and a calendar — into one fast, keyboard-driven desktop workspace.

It's built around **Tiago Forte's PARA method**, a simple system for organizing everything you're working on:

- **Projects** — things with a goal and a finish line (e.g. "Website redesign").
- **Areas** — ongoing parts of your life with no end date (e.g. "Health", "Finance").
- **Resources** — notes and reference material, written in Markdown.
- **Archive** — anything finished or inactive, out of the way but never lost.
- **Inbox** — a quick-capture space for thoughts you'll sort later.

Everything runs **100% offline**. Your data lives in a local SQLite database on your machine — there's no server, no sign-up, and nothing leaves your device unless you export it yourself.

## Features

- **PARA organization** — Areas hold Projects, Projects hold Tasks; notes link to anything, or stay in the Inbox.
- **Dashboard** — a home screen with quick capture, stats, recent activity, and what needs attention.
- **Markdown notes** — a clean CodeMirror editor, with tags and links to projects, areas, and contacts.
- **Tasks** — checklists inside projects, with due dates and drag-to-reorder.
- **Light CRM** — keep contacts with notes and recurring dates (birthdays, anniversaries) that surface on your calendar.
- **Calendar** — month, week, and agenda views for events, deadlines, and contact dates.
- **Pin & favorite** — keep important projects and notes at the top.
- **Filter & sort** — slice projects by status, area, priority, or deadline; filter notes by area or tag.
- **Backup & restore** — export and import your content and settings as JSON, to a location you choose.
- **Appearance** — light / dark / system theme, adjustable zoom, and four UI fonts.
- **Keyboard-first** — quick shortcuts for navigation, capture, and search.
- **Yours, forever** — local-first, open-source, no telemetry, no lock-in.

## Download

Grab the latest build for your platform from the [**Releases page**](https://github.com/xUniti/dano/releases):

| Platform | File |
|----------|------|
| **macOS** (Apple Silicon / Intel) | `.dmg` |
| **Windows** | `.msi` or `.exe` |
| **Linux** | `.AppImage` or `.deb` |

> DANO is currently in **beta** and not yet code-signed. On macOS, right-click the app → **Open** the first time (or run `xattr -dr com.apple.quarantine /Applications/DANO.app`). On Windows, choose **More info → Run anyway** at the SmartScreen prompt.

## Screenshots

<!-- Add screenshots to a docs/ folder and reference them here, e.g.: -->
<!-- ![Dashboard](docs/dashboard.png) -->
<!-- ![Project view](docs/project.png) -->

_Coming soon._

## Tech stack

- **[Tauri v2](https://tauri.app)** — a lightweight, secure desktop shell (Rust + system webview), far smaller than Electron.
- **[Svelte 5](https://svelte.dev)** + **SvelteKit** (static SPA) — reactive UI with runes.
- **SQLite** via `tauri-plugin-sql` — native, reliable, local-only storage.
- **[CodeMirror 6](https://codemirror.net)** — the Markdown note editor.
- **TypeScript** throughout.

## Build from source

You'll need **Rust**, **Node.js**, and the Tauri prerequisites for your OS ([full list here](https://tauri.app/start/prerequisites/)).

On Arch-based distros, the Linux prerequisites are roughly:

```
webkit2gtk-4.1 base-devel curl wget file openssl librsvg
```

Then:

```bash
git clone https://github.com/xUniti/dano.git
cd dano
npm install
npm run tauri dev      # run in development
npm run tauri build    # produce a release bundle
```

## Roadmap

- [x] PARA workspace (Areas, Projects, Tasks, Resources, Archive, Inbox)
- [x] Dashboard, calendar, and a light CRM
- [x] Settings, theming, and JSON backup / restore
- [x] Pin, tags, drag-to-reorder
- [ ] End-to-end encrypted sync (CRDT-based, offline-first)
- [ ] Mobile apps (iOS / Android via Tauri)
- [ ] Calendar sync (CalDAV)

## License

[MIT](LICENSE) © [xUniti](https://xuniti.com)

<div align="center">
<sub>Built by <a href="https://xuniti.com">xUniti</a> — an indie open-source software studio.</sub>
</div>
