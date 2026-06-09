use tauri_plugin_sql::{Migration, MigrationKind};

// DANO schema lives here as append-only SQLite migrations, run by tauri-plugin-sql.
// Source of truth for the database. Add new migrations to the END of this vec;
// never edit a migration that has already shipped — add a new one instead.
//
// Conventions (every entity table):
//   id          TEXT PRIMARY KEY            -- crypto.randomUUID()
//   created_at  INTEGER NOT NULL            -- ms since epoch
//   updated_at  INTEGER NOT NULL            -- ms since epoch
//   archived    INTEGER NOT NULL DEFAULT 0  -- 0 | 1
// Dates that mean a calendar day (daily_hub.date, habit_completions.date, birthdays)
// are TEXT in 'YYYY-MM-DD'. Timestamps are INTEGER ms.
//
// Deferred to the cloud phase (do NOT add now): user_id columns, RLS, vector embeddings.

fn m(version: i64, description: &'static str, sql: &'static str) -> Migration {
    Migration {
        version,
        description,
        sql,
        kind: MigrationKind::Up,
    }
}

fn migrations() -> Vec<Migration> {
    vec![
        m(
            1,
            "create_areas",
            "CREATE TABLE IF NOT EXISTS areas (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                color       TEXT,
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            2,
            "create_goals",
            "CREATE TABLE IF NOT EXISTS goals (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','paused','completed')),
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            3,
            "create_projects",
            "CREATE TABLE IF NOT EXISTS projects (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                status      TEXT NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active','planned','completed','archived')),
                progress    INTEGER NOT NULL DEFAULT 0
                              CHECK (progress BETWEEN 0 AND 100),
                due_at      INTEGER,
                goal_id     TEXT REFERENCES goals(id) ON DELETE SET NULL,
                area_id     TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            4,
            "create_tasks",
            "CREATE TABLE IF NOT EXISTS tasks (
                id           TEXT PRIMARY KEY,
                title        TEXT NOT NULL,
                description  TEXT NOT NULL DEFAULT '',
                status       TEXT NOT NULL DEFAULT 'todo'
                               CHECK (status IN ('todo','doing','waiting','done')),
                priority     TEXT NOT NULL DEFAULT 'p3'
                               CHECK (priority IN ('p1','p2','p3','p4')),
                due_at       INTEGER,
                completed_at INTEGER,
                sort_order   INTEGER NOT NULL DEFAULT 0,
                project_id   TEXT REFERENCES projects(id) ON DELETE SET NULL,
                goal_id      TEXT REFERENCES goals(id) ON DELETE SET NULL,
                tags         TEXT NOT NULL DEFAULT '',
                created_at   INTEGER NOT NULL,
                updated_at   INTEGER NOT NULL,
                archived     INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            5,
            "create_notes",
            "CREATE TABLE IF NOT EXISTS notes (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                content     TEXT NOT NULL DEFAULT '',
                tags        TEXT NOT NULL DEFAULT '',
                pinned      INTEGER NOT NULL DEFAULT 0,
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            6,
            "create_habits",
            "CREATE TABLE IF NOT EXISTS habits (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                frequency   TEXT NOT NULL DEFAULT 'daily'
                              CHECK (frequency IN ('daily','weekly','custom')),
                target      INTEGER NOT NULL DEFAULT 1,
                color       TEXT,
                goal_id     TEXT REFERENCES goals(id) ON DELETE SET NULL,
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            7,
            "create_habit_completions",
            "CREATE TABLE IF NOT EXISTS habit_completions (
                id          TEXT PRIMARY KEY,
                habit_id    TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
                date        TEXT NOT NULL,
                count       INTEGER NOT NULL DEFAULT 1,
                created_at  INTEGER NOT NULL,
                UNIQUE (habit_id, date)
            );",
        ),
        m(
            8,
            "create_events",
            "CREATE TABLE IF NOT EXISTS events (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                start_at    INTEGER NOT NULL,
                end_at      INTEGER,
                all_day     INTEGER NOT NULL DEFAULT 0,
                location    TEXT NOT NULL DEFAULT '',
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL,
                archived    INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            9,
            "create_people",
            "CREATE TABLE IF NOT EXISTS people (
                id                   TEXT PRIMARY KEY,
                first_name           TEXT NOT NULL DEFAULT '',
                last_name            TEXT NOT NULL DEFAULT '',
                email                TEXT NOT NULL DEFAULT '',
                phone                TEXT NOT NULL DEFAULT '',
                avatar_url           TEXT,
                birthday             TEXT,
                notes                TEXT NOT NULL DEFAULT '',
                relationship_tags    TEXT NOT NULL DEFAULT '',
                last_interaction_at  INTEGER,
                created_at           INTEGER NOT NULL,
                updated_at           INTEGER NOT NULL,
                archived             INTEGER NOT NULL DEFAULT 0
            );",
        ),
        m(
            10,
            "create_people_dates",
            "CREATE TABLE IF NOT EXISTS people_dates (
                id          TEXT PRIMARY KEY,
                person_id   TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
                label       TEXT NOT NULL DEFAULT '',
                date        TEXT NOT NULL,
                recurring   INTEGER NOT NULL DEFAULT 1,
                created_at  INTEGER NOT NULL
            );",
        ),
        m(
            11,
            "create_daily_hubs",
            "CREATE TABLE IF NOT EXISTS daily_hubs (
                id          TEXT PRIMARY KEY,
                date        TEXT NOT NULL UNIQUE,
                journal     TEXT NOT NULL DEFAULT '',
                mood        INTEGER CHECK (mood IS NULL OR mood BETWEEN 1 AND 10),
                energy      INTEGER CHECK (energy IS NULL OR energy BETWEEN 1 AND 10),
                wins        TEXT NOT NULL DEFAULT '',
                challenges  TEXT NOT NULL DEFAULT '',
                lessons     TEXT NOT NULL DEFAULT '',
                gratitude   TEXT NOT NULL DEFAULT '',
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL
            );",
        ),
        m(
            12,
            "create_links",
            "CREATE TABLE IF NOT EXISTS links (
                id            TEXT PRIMARY KEY,
                source_type   TEXT NOT NULL,
                source_id     TEXT NOT NULL,
                target_type   TEXT NOT NULL,
                target_id     TEXT NOT NULL,
                relation_type TEXT NOT NULL DEFAULT 'related_to'
                                CHECK (relation_type IN
                                  ('mentioned_in','related_to','belongs_to','follows','depends_on')),
                created_at    INTEGER NOT NULL,
                UNIQUE (source_type, source_id, target_type, target_id, relation_type)
            );",
        ),
        m(
            13,
            "create_notifications",
            "CREATE TABLE IF NOT EXISTS notifications (
                id          TEXT PRIMARY KEY,
                type        TEXT NOT NULL DEFAULT '',
                title       TEXT NOT NULL DEFAULT '',
                body        TEXT NOT NULL DEFAULT '',
                entity_type TEXT,
                entity_id   TEXT,
                read        INTEGER NOT NULL DEFAULT 0,
                created_at  INTEGER NOT NULL
            );",
        ),
        m(
            14,
            "create_activity",
            "CREATE TABLE IF NOT EXISTS activity (
                id          TEXT PRIMARY KEY,
                entity_type TEXT,
                entity_id   TEXT,
                kind        TEXT NOT NULL,
                title       TEXT NOT NULL DEFAULT '',
                detail      TEXT NOT NULL DEFAULT '',
                created_at  INTEGER NOT NULL
            );",
        ),
        m(
            15,
            "index_links_source",
            "CREATE INDEX IF NOT EXISTS idx_links_source ON links (source_type, source_id);",
        ),
        m(
            16,
            "index_links_target",
            "CREATE INDEX IF NOT EXISTS idx_links_target ON links (target_type, target_id);",
        ),
        m(
            17,
            "index_tasks_project",
            "CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks (project_id);",
        ),
        m(
            18,
            "index_tasks_due",
            "CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks (due_at);",
        ),
        m(
            19,
            "index_projects_area",
            "CREATE INDEX IF NOT EXISTS idx_projects_area ON projects (area_id);",
        ),
        m(
            20,
            "index_events_start",
            "CREATE INDEX IF NOT EXISTS idx_events_start ON events (start_at);",
        ),
        m(
            21,
            "create_attachments",
            "CREATE TABLE IF NOT EXISTS attachments (
                id          TEXT PRIMARY KEY,
                entity_type TEXT NOT NULL,
                entity_id   TEXT NOT NULL,
                name        TEXT NOT NULL,
                mime        TEXT NOT NULL DEFAULT '',
                size        INTEGER NOT NULL DEFAULT 0,
                path        TEXT NOT NULL,
                created_at  INTEGER NOT NULL
            );",
        ),
        m(
            22,
            "index_attachments_entity",
            "CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments (entity_type, entity_id);",
        ),
    ]
}

// Write a JSON backup next to the database (in the app config dir). Returns the path.
#[tauri::command]
fn export_backup(app: tauri::AppHandle, contents: String) -> Result<String, String> {
    use tauri::Manager;
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = dir.join("dano-backup.json");
    std::fs::write(&path, contents).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

// Copy file bytes (picked in the webview) into the app data dir's `attachments/`
// folder under a collision-proof name. Returns the absolute path for the DB row.
#[tauri::command]
fn save_attachment(app: tauri::AppHandle, name: String, bytes: Vec<u8>) -> Result<String, String> {
    use std::time::{SystemTime, UNIX_EPOCH};
    use tauri::Manager;
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("attachments");
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    // Keep the original (sanitized) filename, prefixed with a unique stamp.
    let safe: String = name
        .chars()
        .map(|c| if c.is_alphanumeric() || matches!(c, '.' | '-' | '_') { c } else { '_' })
        .collect();
    let path = dir.join(format!("{stamp}_{safe}"));
    std::fs::write(&path, bytes).map_err(|e| e.to_string())?;
    Ok(path.to_string_lossy().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                // NOTE: dano_v1.db (not dano.db) so we don't collide with the old
                // v0.5.0 database that shares this app identifier on dev machines.
                .add_migrations("sqlite:dano_v1.db", migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![export_backup, save_attachment])
        .setup(|app| {
            // System tray with Show / Quit (desktop only).
            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::TrayIconBuilder;
                use tauri::Manager;

                let show = MenuItem::with_id(app, "show", "Show DANO", true, None::<&str>)?;
                let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show, &quit])?;

                TrayIconBuilder::new()
                    .icon(app.default_window_icon().unwrap().clone())
                    .tooltip("DANO")
                    .menu(&menu)
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "quit" => app.exit(0),
                        "show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.set_focus();
                            }
                        }
                        _ => {}
                    })
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
