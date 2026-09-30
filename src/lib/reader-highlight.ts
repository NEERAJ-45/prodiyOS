const MARK_SELECTOR = 'mark[data-reader-mark]';

export function clearHighlights(root: HTMLElement): void {
  root.querySelectorAll(MARK_SELECTOR).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize(); // merge split text nodes back together
  });
}

export function highlightText(root: HTMLElement, query: string): HTMLElement[] {
  clearHighlights(root);
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const marks: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) textNodes.push(node as Text);

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? '';
    const lower = text.toLowerCase();
    if (!lower.includes(needle)) continue;
    const parent = textNode.parentNode;
    if (!parent) continue;

    const frag = document.createDocumentFragment();
    let last = 0;
    let pos = lower.indexOf(needle);
    while (pos !== -1) {
      if (pos > last) frag.appendChild(document.createTextNode(text.slice(last, pos)));
      const mark = document.createElement('mark');
      mark.setAttribute('data-reader-mark', '');
      mark.textContent = text.slice(pos, pos + needle.length);
      frag.appendChild(mark);
      marks.push(mark);
      last = pos + needle.length;
      pos = lower.indexOf(needle, last);
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    parent.replaceChild(frag, textNode);
  }
  return marks;
}
