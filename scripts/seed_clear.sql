-- Remove ONLY the DANO demo data inserted by seed.sql.
-- Matches the fixed 'seed-' id prefix, so your real rows are untouched.
--
-- Usage:
--   sqlite3 ~/.local/share/com.xuniti.dano/dano.db < scripts/seed_clear.sql

PRAGMA foreign_keys = OFF;

DELETE FROM activity        WHERE id LIKE 'seed-%';
DELETE FROM contact_links   WHERE id LIKE 'seed-%';
DELETE FROM contact_dates   WHERE id LIKE 'seed-%';
DELETE FROM contacts        WHERE id LIKE 'seed-%';
DELETE FROM resource_links  WHERE id LIKE 'seed-%';
DELETE FROM resources       WHERE id LIKE 'seed-%';
DELETE FROM tasks           WHERE id LIKE 'seed-%';
DELETE FROM projects        WHERE id LIKE 'seed-%';
DELETE FROM areas           WHERE id LIKE 'seed-%';

PRAGMA foreign_keys = ON;
