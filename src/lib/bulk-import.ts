export type ImportMode = 'text' | 'xml' | 'csv';

export interface BulkQuestion {
  title: string;
  difficulty: string;
  link: string;
}

const DIFF_WORDS = ['easy', 'medium', 'hard'];

function normalizeDifficulty(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v.includes('easy')) return 'EASY';
  if (v.includes('hard')) return 'HARD';
  return 'MEDIUM';
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/\s*[\[(]\s*(?:easy|medium|hard)\s*[\])]$/i, '')
    .trim();
}

function isDiffToken(v: string): boolean {
  const t = v.trim().toLowerCase();
  return DIFF_WORDS.some((d) => t === d || t.replace(/[\][()]/g, '') === d);
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseTextMode(text: string): BulkQuestion[] {
  const out: BulkQuestion[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes('|') || line.includes('\t')) {
      const parts = line
        .split(/[|\t]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        const title = cleanTitle(parts[0]);
        let link = '';
        let diff = '';
        for (const p of parts.slice(1)) {
          if (/^https?:\/\//.test(p)) link = p;
          else if (isDiffToken(p)) diff = p;
        }
        if (title) out.push({ title, difficulty: normalizeDifficulty(diff), link });
        continue;
      }
    }

    let link = '';
    let title = line.replace(/https?:\/\/\S+/g, (m) => {
      if (!link) link = m.replace(/[.,;]+$/, '');
      return '';
    });
    let diff = '';
    const diffMatch = title.match(/\s*[\[(]\s*(easy|medium|hard)\s*[\])]$/i);
    if (diffMatch) diff = diffMatch[1];
    title = cleanTitle(title);
    if (title) out.push({ title, difficulty: normalizeDifficulty(diff), link });
  }
  return out;
}

function parseCsvMode(text: string): BulkQuestion[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error('CSV is empty.');

  const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const firstCells = splitLine(lines[0], delim);
  const hasHeader = firstCells.some((h) =>
    /title|name|question|problem|topic|difficulty|level|link|url/i.test(h)
  );

  let titleI = 0;
  let diffI = -1;
  let linkI = -1;
  let start = 0;

  if (hasHeader) {
    start = 1;
    firstCells.forEach((h, i) => {
      const hh = h.toLowerCase();
      if (diffI === -1 && /difficulty|level|diff|complexity|rating/.test(hh)) diffI = i;
      else if (linkI === -1 && /link|url|href/.test(hh)) linkI = i;
      else if (/title|name|question|problem|topic|item/.test(hh)) titleI = i;
    });
  }

  const out: BulkQuestion[] = [];
  for (let li = start; li < lines.length; li++) {
    const cells = splitLine(lines[li], delim);
    const title = cleanTitle(cells[titleI] || '');
    if (!title) continue;
    let diff = diffI !== -1 ? cells[diffI] || '' : '';
    let link = linkI !== -1 ? cells[linkI] || '' : '';
    if (diffI === -1 || linkI === -1) {
      for (let ci = 0; ci < cells.length; ci++) {
        if (ci === titleI) continue;
        const cell = cells[ci] || '';
        if (!cell) continue;
        if (/^https?:\/\//.test(cell) && !link) link = cell;
        else if (!diff && isDiffToken(cell)) diff = cell;
      }
    }
    out.push({ title, difficulty: normalizeDifficulty(diff), link });
  }
  return out;
}

function pickField(node: Element, names: string[]): string {
  for (const name of names) {
    const child = Array.from(node.children).find(
      (c) => c.localName.toLowerCase() === name
    );
    if (child?.textContent?.trim()) return child.textContent.trim();
    const attr = Array.from(node.attributes || []).find(
      (a) => a.name.toLowerCase() === name
    );
    if (attr?.value?.trim()) return attr.value.trim();
  }
  return '';
}

function parseXmlMode(text: string): BulkQuestion[] {
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Invalid XML document.');
  }

  const semanticNames = new Set([
    'item', 'question', 'problem', 'row', 'entry', 'topic', 'task', 'q', 'listitem',
  ]);
  let nodes = Array.from(doc.getElementsByTagName('*')).filter((el) =>
    semanticNames.has(el.localName.toLowerCase())
  );

  const root = doc.documentElement;
  if (!nodes.length && root) {
    nodes = Array.from(root.children);
    if (!nodes.length) nodes = [root];
  }

  const out: BulkQuestion[] = [];
  for (const node of nodes) {
    let title = pickField(node, ['title', 'name', 'question', 'problem', 'topic', 'label', 'text']);
    if (!title) {
      const hasElementKids = node.children.length > 0;
      if (!hasElementKids) title = (node.textContent || '').trim();
    }
    if (!title) continue;
    const difficulty = pickField(node, ['difficulty', 'level', 'diff', 'complexity', 'rating']);
    const link = pickField(node, ['link', 'url', 'href', 'reference']);
    out.push({
      title: cleanTitle(title),
      difficulty: normalizeDifficulty(difficulty),
      link,
    });
  }
  return out.filter((q) => q.title);
}

export function detectImportMode(filename: string, text: string): ImportMode {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'xml') return 'xml';
  if (ext === 'txt' || ext === 'text' || ext === 'md') return 'text';

  const t = text.trimStart();
  if (t.startsWith('<?xml') || t.startsWith('<')) return 'xml';
  const firstLine = t.split(/\r?\n/)[0] || '';
  if (firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';')) return 'csv';
  return 'text';
}

export function parseBulkQuestions(text: string, mode: ImportMode): BulkQuestion[] {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Nothing to import — the content is empty.');

  const rows =
    mode === 'csv' ? parseCsvMode(trimmed)
    : mode === 'xml' ? parseXmlMode(trimmed)
    : parseTextMode(trimmed);

  const seen = new Set<string>();
  const out: BulkQuestion[] = [];
  for (const row of rows) {
    const key = row.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }

  if (!out.length) {
    throw new Error('No questions found. Check the format and try again.');
  }
  return out;
}
