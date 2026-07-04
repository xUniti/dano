// Backup and restore. Everything DANO stores lives under the `dano.` prefix in
// localStorage, so a backup is just those keys written to a JSON file, and a
// restore writes them back and reloads so the stores re-read from storage.

const PREFIX = 'dano.';

type Backup = {
	app: 'dano';
	version: 1;
	exportedAt: string;
	data: Record<string, unknown>;
};

/** Download every DANO key as a single JSON file. */
export function exportData(): void {
	const data: Record<string, unknown> = {};
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (!key || !key.startsWith(PREFIX)) continue;
		const raw = localStorage.getItem(key);
		if (raw === null) continue;
		try {
			data[key] = JSON.parse(raw);
		} catch {
			data[key] = raw; // keep non-JSON values verbatim
		}
	}
	const backup: Backup = { app: 'dano', version: 1, exportedAt: new Date().toISOString(), data };
	const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `dano-backup-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * Restore from a backup file, then reload. Validates the file is a DANO backup
 * and only writes `dano.` keys, so a stray file can't set arbitrary storage.
 */
export async function importData(file: File): Promise<void> {
	const parsed = JSON.parse(await file.text()) as Partial<Backup>;
	// ponytail: trust boundary — reject anything that isn't a DANO backup shape.
	if (parsed?.app !== 'dano' || typeof parsed.data !== 'object' || parsed.data === null) {
		throw new Error('This is not a DANO backup file.');
	}
	for (const [key, value] of Object.entries(parsed.data)) {
		if (!key.startsWith(PREFIX)) continue;
		localStorage.setItem(key, JSON.stringify(value));
	}
	location.reload();
}
