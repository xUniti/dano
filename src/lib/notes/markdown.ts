// Tiny, dependency-free markdown renderer. HTML is escaped first, so output is
// safe to use with {@html}. Covers what the editor toolbar produces: headings,
// bold/italic/strikethrough, inline code + code blocks, links, quotes, ordered
// and unordered lists, task checkboxes, and horizontal rules.

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(text: string): string {
	let t = escapeHtml(text);
	t = t.replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`);
	t = t.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		(_, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
	);
	t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	t = t.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	t = t.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
	return t;
}

const BLOCK_START = /^(#{1,6}\s|```|>\s?|\s*[-*]\s+|\s*\d+\.\s+|---+\s*$)/;

export function renderMarkdown(src: string): string {
	const lines = (src ?? '').replace(/\r\n/g, '\n').split('\n');
	const out: string[] = [];
	let i = 0;

	while (i < lines.length) {
		const line = lines[i];

		if (/^```/.test(line)) {
			const code: string[] = [];
			i++;
			while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
			i++;
			out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
			continue;
		}

		const h = line.match(/^(#{1,6})\s+(.*)$/);
		if (h) {
			const lvl = h[1].length;
			out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
			i++;
			continue;
		}

		if (/^---+\s*$/.test(line)) {
			out.push('<hr>');
			i++;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const q: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i])) q.push(lines[i++].replace(/^>\s?/, ''));
			out.push(`<blockquote>${inline(q.join(' '))}</blockquote>`);
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
				const m = lines[i].match(/^\s*[-*]\s+(\[([ xX])\]\s+)?(.*)$/);
				if (m && m[1]) {
					const checked = m[2].toLowerCase() === 'x';
					items.push(
						`<li class="task"><input type="checkbox" disabled${checked ? ' checked' : ''}> <span>${inline(m[3])}</span></li>`
					);
				} else {
					items.push(`<li>${inline(m ? m[3] : lines[i])}</li>`);
				}
				i++;
			}
			out.push(`<ul>${items.join('')}</ul>`);
			continue;
		}

		if (/^\s*\d+\.\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
				const m = lines[i].match(/^\s*\d+\.\s+(.*)$/);
				items.push(`<li>${inline(m ? m[1] : lines[i])}</li>`);
				i++;
			}
			out.push(`<ol>${items.join('')}</ol>`);
			continue;
		}

		if (/^\s*$/.test(line)) {
			i++;
			continue;
		}

		const para: string[] = [];
		while (i < lines.length && lines[i].trim() !== '' && !BLOCK_START.test(lines[i])) {
			para.push(lines[i++]);
		}
		out.push(`<p>${inline(para.join(' '))}</p>`);
	}

	return out.join('\n');
}
