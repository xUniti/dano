<div align="center">

<img src="static/dano-logo.svg" width="120" alt="DANO logo" />

# DANO OS

**A local-first Life Operating System.**

*Your tasks, projects, notes, people, habits, and days — connected in one private graph.*

</div>

---

## The problem

Modern life is scattered across a dozen apps. Tasks live in one place, notes in another, your calendar somewhere else, contacts in your phone, journaling in yet another app, projects in isolated tools.

The result is **lost context**: forgotten relationships, disconnected knowledge, and reflection that never really happens. You spend more time managing tools than living.

## The idea

DANO is not another productivity app. It's a **digital mirror of your life** — a single, connected space where everything you track lives together and nothing stays isolated.

Every action, thought, relationship, and event becomes part of one **connected, searchable, time-aware graph** of your life: past (timeline), present (today), and future (plans).

> DANO's purpose is not productivity. Its purpose is to create a complete, living digital representation of your life.

---

## What you can do

### 🗓️ Daily Hub — the heart
A page is created **automatically for every day**. Write freely in the journal, track your **mood and energy**, and capture **wins, challenges, lessons, and gratitude**. Below that, DANO assembles your day for you — the tasks you completed, habits you logged, events you attended, notes you wrote, and people you connected with — all pulled in automatically.

### ✅ Tasks
Capture work the moment it appears. See it as **Today**, **Upcoming**, a drag-and-drop **Board**, or a flat **List**. Priorities, due dates, statuses (todo → doing → waiting → done), and links to the projects and people they belong to.

### 📁 Areas, Projects & Goals
Organize life the way it actually works: permanent **Areas** (Health, Career, Finance…) hold **Projects**, projects hold **Tasks**, and **Goals** track the bigger outcomes. Project progress is **computed automatically** as you complete tasks.

### 📝 Notes
A clean markdown editor with live preview. Type `@` to mention a **person** or `#` to link a **task** — DANO creates the connection instantly, and every note shows its **backlinks**, so your knowledge compounds over time.

### 🧑‍🤝‍🧑 People — relationships, not a CRM
Each person has a **relationship timeline** of every interaction, a **strength score** based on how often and how recently you connect, and a **follow-up engine** that surfaces upcoming birthdays and people you've gone quiet with.

### 🔥 Habits
Build momentum with daily habits. DANO tracks real **streaks** and **completion rates**, with a 14-day heatmap you can tap to fill in.

### 📆 Calendar
Your events, task deadlines, and birthdays in one view — **Month**, **Week**, **Day**, or **Agenda**.

### 📊 Dashboard
Your whole life in one glance: today's focus, active projects, people to follow up with, habit status, upcoming events, a daily-hub preview, goal progress, and your latest notes.

### ⌘ Command palette
Press `⌘K` (or `Ctrl+K`) anywhere to **search across everything** or **create it on the spot** — a task, a note, a person — without leaving what you're doing.

---

## The principles behind it

- **Everything has a time.** Every object lives on a timeline — past, present, and future.
- **Everything is connected.** Any object can link to any other. Nothing is an island.
- **People are central.** Relationships are core entities, not an afterthought.
- **The day is the atomic unit.** Life is lived one day at a time — the Daily Hub is the center.
- **Knowledge compounds.** Notes and experiences gain value through their connections.
- **Reflection = execution.** Thinking and doing matter equally.

---

## Private by design

DANO is **local-first**. Your entire life lives in a local SQLite database **on your own machine** — no account, no cloud, no servers, fully offline. You can **export a complete backup** to a JSON file anytime, from Settings.

*Optional cloud sync across devices is a future, opt-in step — never the default.*

---

## Run it

```bash
npm install
npm run tauri dev
```

Built from scratch with **SvelteKit 5** + **Tauri 2** — a tiny, fast, low-maintenance native desktop app for **Windows, macOS, and Linux**. Because it uses your OS's native webview instead of bundling a browser, the install stays small.

---

## Roadmap

- ✅ **Now** — Full local-first desktop app: Daily Hub, Tasks, Projects, Areas, Goals, Notes, People, Habits, Calendar, Dashboard, and ⌘K.
- 🔜 **Next** — Desktop polish: auto-updater and signed installers.
- ☁️ **Later** — Optional cloud sync (multi-device).
- 📱 **Later** — Mobile apps for iOS and Android, from the same codebase.

---

<div align="center">
<sub>DANO OS · a local-first life operating system · made by xUniti</sub>
</div>
