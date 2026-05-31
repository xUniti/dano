use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // DANO schema — hierarchical PARA.
    // Areas hold Projects, Projects hold Tasks. Resources (= notes) are
    // standalone Markdown items linked to many targets via resource_links;
    // an unlinked resource lives in the Inbox. `archived` is a flag on every
    // entity. One statement per migration (the plugin runs them individually).
    let migrations = vec![
        Migration {
            version: 1,
            description: "create_areas",
            sql: "CREATE TABLE IF NOT EXISTS areas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_projects",
            sql: "CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                area_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                due_at INTEGER,
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_tasks",
            sql: "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                project_id TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'todo',
                due_at INTEGER,
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create_resources",
            sql: "CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 5,
            description: "create_resource_links",
            sql: "CREATE TABLE IF NOT EXISTS resource_links (
                id TEXT PRIMARY KEY,
                resource_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 6,
            description: "create_events",
            sql: "CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT '',
                start_at INTEGER NOT NULL,
                end_at INTEGER,
                all_day INTEGER NOT NULL DEFAULT 1,
                notes TEXT NOT NULL DEFAULT '',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 7,
            description: "create_contacts",
            sql: "CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                notes TEXT NOT NULL DEFAULT '',
                archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 8,
            description: "create_contact_dates",
            sql: "CREATE TABLE IF NOT EXISTS contact_dates (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL,
                label TEXT NOT NULL DEFAULT 'Birthday',
                date_at INTEGER NOT NULL,
                recurring INTEGER NOT NULL DEFAULT 1,
                created_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 9,
            description: "create_contact_links",
            sql: "CREATE TABLE IF NOT EXISTS contact_links (
                id TEXT PRIMARY KEY,
                contact_id TEXT NOT NULL,
                project_id TEXT NOT NULL,
                created_at INTEGER NOT NULL
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:dano.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
