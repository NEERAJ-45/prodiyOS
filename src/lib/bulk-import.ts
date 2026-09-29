import * as XLSX from 'xlsx';

export type ImportMode = 'text' | 'excel' | 'csv';

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
    .trim()
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
    }).trim();
    let diff = '';
    const diffMatch = title.match(/\s*[\[(]\s*(easy|medium|hard)\s*[\])]$/i);
    if (diffMatch) diff = diffMatch[1];
    title = cleanTitle(title);
    if (title) out.push({ title, difficulty: normalizeDifficulty(diff), link });
  }
  return out;
}

function mapRowsToQuestions(rows: string[][]): BulkQuestion[] {
  if (!rows.length) throw new Error('No rows found.');

  const firstCells = rows[0].map((c) => (c ?? '').trim());
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
  for (let li = start; li < rows.length; li++) {
    const cells = rows[li].map((c) => (c ?? '').toString().trim());
    if (cells.every((c) => !c)) continue;
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

function parseCsvMode(text: string): BulkQuestion[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) throw new Error('CSV is empty.');

  const delim = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ',';
  const rows = lines.map((line) => splitLine(line, delim));
  return mapRowsToQuestions(rows);
}

function parseExcelMode(buffer: ArrayBuffer): BulkQuestion[] {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('Workbook has no sheets.');
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });
  const strRows = rows.map((r) => r.map((c) => (c == null ? '' : String(c))));
  return mapRowsToQuestions(strRows);
}

export function detectImportMode(filename: string, text: string): ImportMode {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (ext === 'csv' || ext === 'tsv') return 'csv';
  if (ext === 'xlsx' || ext === 'xlsm' || ext === 'xls') return 'excel';
  if (ext === 'txt' || ext === 'text' || ext === 'md') return 'text';

  const t = text.trimStart();
  const firstLine = t.split(/\r?\n/)[0] || '';
  if (firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';')) return 'csv';
  return 'text';
}

export function parseBulkQuestions(content: string | ArrayBuffer, mode: ImportMode): BulkQuestion[] {
  let rows: BulkQuestion[];

  if (mode === 'excel') {
    if (!(content instanceof ArrayBuffer)) {
      throw new Error('Excel mode expects an .xlsx file upload.');
    }
    rows = parseExcelMode(content);
  } else {
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Nothing to import — the content is empty.');
    }
    rows = mode === 'csv' ? parseCsvMode(content.trim()) : parseTextMode(content.trim());
  }

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
