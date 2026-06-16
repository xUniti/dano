// User settings — theme + accessibility. Persisted to localStorage and applied
// as data-* attributes on <html> so the token layer in app.css can react.
// Accessibility is the north star: every option here is independently togglable.
import { browser } from '$app/environment';

export type ThemeMode = 'auto' | 'light' | 'dark';
export type Density = 'compact' | 'comfortable';

const KEY = 'dano.settings';

const DEFAULTS = {
	theme: 'auto' as ThemeMode,
	density: 'compact' as Density,
	highContrast: false,
	textScale: 100, // percent of OS/browser base size
	largeTargets: false,
	reduceMotion: false,
	looseTextSpacing: false,
	dyslexiaFont: false,
	shortLines: false
};

type State = typeof DEFAULTS;

function setFlag(name: string, on: boolean, value = 'on') {
	const el = document.documentElement;
	if (on) el.setAttribute(name, value);
	else el.removeAttribute(name);
}

class Settings {
	theme = $state(DEFAULTS.theme);
	density = $state(DEFAULTS.density);
	highContrast = $state(DEFAULTS.highContrast);
	textScale = $state(DEFAULTS.textScale);
	largeTargets = $state(DEFAULTS.largeTargets);
	reduceMotion = $state(DEFAULTS.reduceMotion);
	looseTextSpacing = $state(DEFAULTS.looseTextSpacing);
	dyslexiaFont = $state(DEFAULTS.dyslexiaFont);
	shortLines = $state(DEFAULTS.shortLines);

	constructor() {
		if (!browser) return;
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<State>;
			const self = this as Record<string, unknown>;
			for (const k of Object.keys(DEFAULTS) as (keyof State)[]) {
				if (saved[k] !== undefined) self[k] = saved[k];
			}
		} catch {
			// ignore corrupt storage
		}
		$effect.root(() => {
			$effect(() => this.#apply());
		});
	}

	#apply() {
		const el = document.documentElement;
		if (this.theme === 'auto') el.removeAttribute('data-theme');
		else el.setAttribute('data-theme', this.theme);

		el.setAttribute('data-density', this.density);
		setFlag('data-contrast', this.highContrast, 'high');
		el.style.fontSize = `${this.textScale}%`;
		setFlag('data-targets', this.largeTargets, 'large');
		setFlag('data-motion', this.reduceMotion, 'off');
		setFlag('data-text-spacing', this.looseTextSpacing, 'loose');
		setFlag('data-dyslexia-font', this.dyslexiaFont, 'on');
		setFlag('data-line-length', this.shortLines, 'short');

		const snapshot: State = {
			theme: this.theme,
			density: this.density,
			highContrast: this.highContrast,
			textScale: this.textScale,
			largeTargets: this.largeTargets,
			reduceMotion: this.reduceMotion,
			looseTextSpacing: this.looseTextSpacing,
			dyslexiaFont: this.dyslexiaFont,
			shortLines: this.shortLines
		};
		localStorage.setItem(KEY, JSON.stringify(snapshot));
	}

	reset() {
		Object.assign(this, DEFAULTS);
	}
}

export const settings = new Settings();
