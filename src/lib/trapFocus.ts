// Focus management for modal dialogs. On open: focus the first field. While
// open: keep Tab and Shift+Tab inside the dialog. On close: return focus to
// whatever was focused before (usually the button that opened it).
// Use on the dialog element: <div role="dialog" use:trapFocus>…

const FOCUSABLE =
	'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapFocus(node: HTMLElement) {
	const opener = document.activeElement as HTMLElement | null;
	const items = () =>
		[...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);

	(items()[0] ?? node).focus();

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const list = items();
		if (!list.length) {
			e.preventDefault();
			return;
		}
		const first = list[0];
		const last = list[list.length - 1];
		const active = document.activeElement;
		if (e.shiftKey && (active === first || active === node)) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && active === last) {
			e.preventDefault();
			first.focus();
		}
	}
	node.addEventListener('keydown', onKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', onKeydown);
			opener?.focus?.();
		}
	};
}
