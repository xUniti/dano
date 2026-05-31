-- DANO demo seed — populates areas, projects, tasks, resources, contacts, activity.
-- Safe to run on an existing dano.db: uses fixed demo IDs (prefixed) and does
-- NOT touch your existing rows. Re-running is idempotent (INSERT OR IGNORE).
--
-- Usage:
--   sqlite3 ~/.local/share/com.xuniti.dano/dano.db < scripts/seed.sql
--
-- To remove ONLY the demo data later, run scripts/seed_clear.sql.

PRAGMA foreign_keys = OFF;

-- Timestamps are computed relative to "now" in milliseconds:
--   (strftime('%s','now') ± 86400*DAYS) * 1000

-- ---------- Areas ----------
INSERT OR IGNORE INTO areas (id, name, archived, created_at, updated_at) VALUES
  ('seed-area-health',  'Health & Fitness',   0, (strftime('%s','now')-86400*40)*1000, (strftime('%s','now')-86400*2)*1000),
  ('seed-area-finance', 'Finance',             0, (strftime('%s','now')-86400*38)*1000, (strftime('%s','now')-86400*5)*1000),
  ('seed-area-career',  'Career Development',  0, (strftime('%s','now')-86400*35)*1000, (strftime('%s','now')-86400*1)*1000);

-- ---------- Projects ----------
-- status: planned | in_progress | ongoing | done ; priority: low | medium | high
INSERT OR IGNORE INTO projects (id, name, area_id, status, priority, description, due_at, archived, created_at, updated_at) VALUES
  ('seed-proj-website', 'Website Redesign', 'seed-area-career', 'in_progress', 'high',
    'Complete overhaul of personal portfolio website — new structure, copy, and visual design aligned with current work.',
    (strftime('%s','now')+86400*15)*1000, 0, (strftime('%s','now')-86400*30)*1000, (strftime('%s','now')-86400*1)*1000),
  ('seed-proj-5k', '5K Training Program', 'seed-area-health', 'ongoing', 'medium',
    'Couch-to-5K plan, three runs per week building up to a parkrun.',
    (strftime('%s','now')+86400*50)*1000, 0, (strftime('%s','now')-86400*20)*1000, (strftime('%s','now')-86400*3)*1000),
  ('seed-proj-morning', 'Morning Routine Plan', 'seed-area-health', 'ongoing', 'low',
    'Design a consistent morning routine: hydration, stretch, deep-work block.',
    NULL, 0, (strftime('%s','now')-86400*18)*1000, (strftime('%s','now')-86400*6)*1000),
  ('seed-proj-emergency', 'Emergency Fund Goal', 'seed-area-finance', 'in_progress', 'high',
    'Save 6 months of expenses into a separate high-yield account.',
    (strftime('%s','now')+86400*120)*1000, 0, (strftime('%s','now')-86400*25)*1000, (strftime('%s','now')-86400*4)*1000),
  ('seed-proj-invest', 'Investment Research', 'seed-area-finance', 'planned', 'medium',
    'Research low-cost index funds and set up automated monthly contributions.',
    NULL, 0, (strftime('%s','now')-86400*12)*1000, (strftime('%s','now')-86400*7)*1000),
  ('seed-proj-mentor', 'Mentorship Program', 'seed-area-career', 'planned', 'medium',
    'Find a mentor in the field and set a recurring monthly check-in.',
    (strftime('%s','now')+86400*40)*1000, 0, (strftime('%s','now')-86400*9)*1000, (strftime('%s','now')-86400*9)*1000);

-- ---------- Tasks ----------
-- status: todo | done
INSERT OR IGNORE INTO tasks (id, title, project_id, status, due_at, archived, created_at, updated_at) VALUES
  ('seed-task-w1', 'Define sitemap and content structure', 'seed-proj-website', 'done',
    (strftime('%s','now')-86400*5)*1000, 0, (strftime('%s','now')-86400*28)*1000, (strftime('%s','now')-86400*5)*1000),
  ('seed-task-w2', 'Create wireframes for homepage', 'seed-proj-website', 'done',
    (strftime('%s','now')-86400*1)*1000, 0, (strftime('%s','now')-86400*26)*1000, (strftime('%s','now')-86400*1)*1000),
  ('seed-task-w3', 'Write copy for About section', 'seed-proj-website', 'todo',
    (strftime('%s','now')+86400*4)*1000, 0, (strftime('%s','now')-86400*20)*1000, (strftime('%s','now')-86400*20)*1000),
  ('seed-task-w4', 'Design case study template', 'seed-proj-website', 'todo',
    (strftime('%s','now')+86400*8)*1000, 0, (strftime('%s','now')-86400*18)*1000, (strftime('%s','now')-86400*18)*1000),
  ('seed-task-w5', 'Build responsive layout in code', 'seed-proj-website', 'todo',
    (strftime('%s','now')+86400*24)*1000, 0, (strftime('%s','now')-86400*15)*1000, (strftime('%s','now')-86400*15)*1000),
  ('seed-task-w6', 'SEO meta tags and Open Graph', 'seed-proj-website', 'todo',
    (strftime('%s','now')+86400*29)*1000, 0, (strftime('%s','now')-86400*15)*1000, (strftime('%s','now')-86400*15)*1000),
  ('seed-task-w7', 'Deploy to production', 'seed-proj-website', 'todo',
    (strftime('%s','now')+86400*39)*1000, 0, (strftime('%s','now')-86400*15)*1000, (strftime('%s','now')-86400*15)*1000),
  ('seed-task-5k1', 'Buy new running shoes', 'seed-proj-5k', 'done',
    (strftime('%s','now')-86400*8)*1000, 0, (strftime('%s','now')-86400*19)*1000, (strftime('%s','now')-86400*8)*1000),
  ('seed-task-5k2', 'Schedule three runs this week', 'seed-proj-5k', 'todo',
    (strftime('%s','now')+86400*1)*1000, 0, (strftime('%s','now')-86400*7)*1000, (strftime('%s','now')-86400*7)*1000),
  ('seed-task-5k3', 'Research a local parkrun', 'seed-proj-5k', 'todo',
    NULL, 0, (strftime('%s','now')-86400*6)*1000, (strftime('%s','now')-86400*6)*1000),
  ('seed-task-ef1', 'Open high-yield savings account', 'seed-proj-emergency', 'done',
    (strftime('%s','now')-86400*10)*1000, 0, (strftime('%s','now')-86400*24)*1000, (strftime('%s','now')-86400*10)*1000),
  ('seed-task-ef2', 'Set up automatic monthly transfer', 'seed-proj-emergency', 'todo',
    (strftime('%s','now')+86400*2)*1000, 0, (strftime('%s','now')-86400*9)*1000, (strftime('%s','now')-86400*9)*1000),
  ('seed-task-ef3', 'Review monthly budget', 'seed-proj-emergency', 'todo',
    (strftime('%s','now')+86400*5)*1000, 0, (strftime('%s','now')-86400*8)*1000, (strftime('%s','now')-86400*8)*1000),
  ('seed-task-mr1', 'Draft a 30-minute morning block', 'seed-proj-morning', 'todo',
    NULL, 0, (strftime('%s','now')-86400*6)*1000, (strftime('%s','now')-86400*6)*1000),
  ('seed-task-me1', 'Update LinkedIn profile', 'seed-proj-mentor', 'todo',
    (strftime('%s','now')+86400*3)*1000, 0, (strftime('%s','now')-86400*9)*1000, (strftime('%s','now')-86400*9)*1000),
  ('seed-task-me2', 'List 5 potential mentors', 'seed-proj-mentor', 'todo',
    (strftime('%s','now')+86400*10)*1000, 0, (strftime('%s','now')-86400*9)*1000, (strftime('%s','now')-86400*9)*1000);

-- ---------- Resources (notes) ----------
INSERT OR IGNORE INTO resources (id, title, content, archived, created_at, updated_at) VALUES
  ('seed-res-moodboard', 'Inspiration & moodboard',
    '# Inspiration & moodboard' || char(10) || char(10) ||
    'Collected references for the redesign: clean typography, generous whitespace, muted palette. Look at Linear, Stripe, and Vercel for layout rhythm.',
    0, (strftime('%s','now')-86400*22)*1000, (strftime('%s','now')-86400*3)*1000),
  ('seed-res-feedback', 'Client feedback — round 1',
    '# Client feedback — round 1' || char(10) || char(10) ||
    '- Homepage hero should lead with the value proposition.' || char(10) ||
    '- Reduce the number of CTAs above the fold.' || char(10) ||
    '- Case studies need consistent thumbnails.',
    0, (strftime('%s','now')-86400*7)*1000, (strftime('%s','now')-86400*7)*1000),
  ('seed-res-stack', 'Tech stack decision',
    '# Tech stack decision' || char(10) || char(10) ||
    'Going with Astro + Tailwind for the marketing site, content in markdown. Deploy to Cloudflare. Revisit a CMS later if needed.',
    0, (strftime('%s','now')-86400*14)*1000, (strftime('%s','now')-86400*14)*1000),
  ('seed-res-runlog', 'Running log template',
    '# Running log' || char(10) || char(10) || 'Track date, distance, time, and notes for each run.',
    0, (strftime('%s','now')-86400*5)*1000, (strftime('%s','now')-86400*5)*1000),
  ('seed-res-zettel', 'Read article on Zettelkasten method',
    'Saved to read later — note-taking method that links atomic notes.',
    0, (strftime('%s','now')-3600*2)*1000, (strftime('%s','now')-3600*2)*1000),
  ('seed-res-standup', 'Meeting notes from standup',
    'Quick capture: follow up on deployment pipeline, ask about staging env.',
    0, (strftime('%s','now')-3600*6)*1000, (strftime('%s','now')-3600*6)*1000);

-- Link the project notes (target_type 'project'). zettel + standup stay unlinked = Inbox.
INSERT OR IGNORE INTO resource_links (id, resource_id, target_type, target_id, created_at) VALUES
  ('seed-link-1', 'seed-res-moodboard', 'project', 'seed-proj-website', (strftime('%s','now')-86400*22)*1000),
  ('seed-link-2', 'seed-res-feedback',  'project', 'seed-proj-website', (strftime('%s','now')-86400*7)*1000),
  ('seed-link-3', 'seed-res-stack',     'project', 'seed-proj-website', (strftime('%s','now')-86400*14)*1000),
  ('seed-link-4', 'seed-res-runlog',    'project', 'seed-proj-5k',      (strftime('%s','now')-86400*5)*1000);

-- ---------- Contacts ----------
INSERT OR IGNORE INTO contacts (id, name, notes, archived, created_at, updated_at) VALUES
  ('seed-contact-alex', 'Alex Johnson', 'Client / stakeholder for the website redesign. Prefers email over calls.',
    0, (strftime('%s','now')-86400*30)*1000, (strftime('%s','now')-86400*2)*1000),
  ('seed-contact-sam', 'Sam Rivera', 'Potential mentor — senior engineer, met at a meetup.',
    0, (strftime('%s','now')-86400*12)*1000, (strftime('%s','now')-86400*9)*1000);

INSERT OR IGNORE INTO contact_dates (id, contact_id, label, date_at, recurring, created_at) VALUES
  ('seed-cd-alex-bday', 'seed-contact-alex', 'Birthday', (strftime('%s','now')+86400*12)*1000, 1, (strftime('%s','now')-86400*30)*1000),
  ('seed-cd-sam-bday',  'seed-contact-sam',  'Birthday', (strftime('%s','now')+86400*60)*1000, 1, (strftime('%s','now')-86400*12)*1000);

INSERT OR IGNORE INTO contact_links (id, contact_id, project_id, created_at) VALUES
  ('seed-cl-1', 'seed-contact-alex', 'seed-proj-website', (strftime('%s','now')-86400*30)*1000),
  ('seed-cl-2', 'seed-contact-sam',  'seed-proj-mentor',  (strftime('%s','now')-86400*12)*1000);

-- ---------- Activity (audit trail for the Website project) ----------
INSERT OR IGNORE INTO activity (id, project_id, kind, title, detail, created_at) VALUES
  ('seed-act-1', 'seed-proj-website', 'project_created',  'Project created',  'Added to Career Development',          (strftime('%s','now')-86400*30)*1000),
  ('seed-act-2', 'seed-proj-website', 'deadline_updated', 'Deadline updated', 'Moved to a date 15 days out',          (strftime('%s','now')-86400*14)*1000),
  ('seed-act-3', 'seed-proj-website', 'note_added',       'Note added',       'Client feedback — round 1',            (strftime('%s','now')-86400*7)*1000),
  ('seed-act-4', 'seed-proj-website', 'task_completed',   'Task completed',   'Define sitemap and content structure', (strftime('%s','now')-86400*5)*1000),
  ('seed-act-5', 'seed-proj-website', 'task_completed',   'Task completed',   'Create wireframes for homepage',       (strftime('%s','now')-86400*1)*1000);

PRAGMA foreign_keys = ON;
