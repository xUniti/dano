// Tiny, dependency-free markdown renderer for notes preview.
// Escapes HTML first (safe for local content), then applies a small subset:
// headings, bold, italic, inline code, code blocks, links, blockquotes, lists,
// @mentions / #refs, and paragraphs. Not CommonMark-complete — good enough for v1.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inline(s: string): string {
  return s
    // [[wiki-links]] to other notes (graph link created in the editor)
    .replace(/\[\[([^\]\n]+)\]\]/g, '<span class="rounded bg-indigo-500/15 px-1 text-indigo-300">$1</span>')
    .replace(/`([^`]+)`/g, '<code class="rounded bg-white/10 px-1 py-0.5 text-[0.85em]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-sky-400 hover:underline">$1</a>',
    )
    // highlight @mentions and #refs (linking is handled in the editor)
    .replace(/(^|\s)([@#][\w][\w .-]*?)(?=[.,;!?]?(\s|$))/g,
      '$1<span class="rounded bg-sky-500/15 px-1 text-sky-300">$2</span>');
}

export function renderMarkdown(md: string): string {
  const src = escapeHtml(md ?? "");
  const lines = src.split("\n");
  const html: string[] = [];
  let inCode = false;
  let listOpen = false;

  const closeList = () => {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  };

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        closeList();
        html.push('<pre class="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs"><code>');
        inCode = true;
      } else {
        html.push("</code></pre>");
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      html.push(line);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      closeList();
      const level = h[1].length;
      const sizes = ["text-xl", "text-lg", "text-base", "text-sm"];
      html.push(`<h${level} class="mt-3 mb-1 font-semibold ${sizes[level - 1]}">${inline(h[2])}</h${level}>`);
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      if (!listOpen) {
        html.push('<ul class="my-1 list-disc space-y-0.5 pl-5">');
        listOpen = true;
      }
      html.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      closeList();
      html.push(`<blockquote class="border-l-2 border-white/20 pl-3 text-white/60">${inline(line.replace(/^\s*>\s?/, ""))}</blockquote>`);
      continue;
    }

    if (line.trim() === "") {
      closeList();
      continue;
    }

    closeList();
    html.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  if (inCode) html.push("</code></pre>");
  return html.join("\n");
}
