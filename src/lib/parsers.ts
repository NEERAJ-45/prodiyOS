export interface CustomQuestion {
  id: string;
  question: string;
  answer: string;
}

export interface CustomSection {
  id: string;
  title: string;
  questions: CustomQuestion[];
}

export interface CustomQAParsedData {
  title: string;
  totalQuestions: number;
  sections: CustomSection[];
}

function splitCSVLine(line: string, delimiter: string = ','): string[] {
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

function parseJSON(text: string): CustomQAParsedData {
  const parsedJson = JSON.parse(text);

  if (parsedJson && typeof parsedJson === 'object' && Array.isArray(parsedJson.sections)) {
    const sections: CustomSection[] = parsedJson.sections.map((sec: Record<string, unknown>, idx: number) => ({
      id: String(sec.section ?? sec.id ?? `sec-${idx}`),
      title: String(sec.title ?? `Section ${idx + 1}`),
      questions: ((sec.questions ?? []) as Record<string, unknown>[]).map((q: Record<string, unknown>, qIdx: number) => ({
        id: String(q.id ?? `q-${idx}-${qIdx}`),
        question: String(q.question ?? q.q ?? ''),
        answer: String(q.answer ?? q.a ?? ''),
      })).filter((q) => Boolean(q.question)),
    }));

    return {
      title: parsedJson.title || 'Custom Imported Q&A',
      totalQuestions: sections.reduce((acc, s) => acc + s.questions.length, 0),
      sections,
    };
  }

  if (Array.isArray(parsedJson)) {
    const questions: CustomQuestion[] = parsedJson.map((q: Record<string, unknown>, idx: number) => ({
      id: String(q.id ?? `q-${idx}`),
      question: String(q.question ?? q.q ?? ''),
      answer: String(q.answer ?? q.a ?? ''),
    })).filter((q) => Boolean(q.question));

    return {
      title: 'Custom Imported Q&A',
      totalQuestions: questions.length,
      sections: [{ id: 'general', title: 'General Questions', questions }],
    };
  }

  throw new Error('Unsupported JSON format.');
}

function parseCSV(text: string): CustomQAParsedData {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 1) throw new Error('CSV text is empty.');

  const firstLine = lines[0];
  let delimiter = ',';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';

  const headers = splitCSVLine(firstLine, delimiter).map(h => h.toLowerCase());
  let questionColIndex = 0;
  let answerColIndex = 1;

  const qIndex = headers.findIndex(h => h.includes('question') || h === 'q' || h.includes('desc'));
  const aIndex = headers.findIndex(h => h.includes('answer') || h === 'a' || h.includes('resp'));

  const dataLines = [...lines];
  if (qIndex !== -1 && aIndex !== -1) {
    questionColIndex = qIndex;
    answerColIndex = aIndex;
    dataLines.shift();
  }

  const questions: CustomQuestion[] = dataLines.map((line, idx) => {
    const columns = splitCSVLine(line, delimiter);
    return {
      id: `q-${idx}`,
      question: columns[questionColIndex] || '',
      answer: columns[answerColIndex] || '',
    };
  }).filter(q => q.question);

  return {
    title: 'Custom CSV Questions',
    totalQuestions: questions.length,
    sections: [{ id: 'general', title: 'General Questions', questions }],
  };
}

function parseTXT(text: string): CustomQAParsedData {
  const lines = text.split(/\r?\n/);
  const questions: CustomQuestion[] = [];
  let currentQuestion = '';
  let currentAnswer = '';
  let mode: 'q' | 'a' | 'none' = 'none';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const qMatch = trimmed.match(/^(?:q(?:uestion)?\s*\d*\s*[:.-]\s*)(.*)/i);
    const aMatch = trimmed.match(/^(?:a(?:nswer)?\s*[:.-]\s*)(.*)/i);

    if (qMatch) {
      if (currentQuestion && currentAnswer) {
        questions.push({ id: `q-${questions.length}`, question: currentQuestion.trim(), answer: currentAnswer.trim() });
        currentQuestion = '';
        currentAnswer = '';
      }
      currentQuestion = qMatch[1];
      mode = 'q';
    } else if (aMatch) {
      currentAnswer = aMatch[1];
      mode = 'a';
    } else {
      const numberMatch = trimmed.match(/^\d+[\s.-]+(.*)/);
      if (numberMatch && mode !== 'q') {
        if (currentQuestion && currentAnswer) {
          questions.push({ id: `q-${questions.length}`, question: currentQuestion.trim(), answer: currentAnswer.trim() });
          currentQuestion = '';
          currentAnswer = '';
        }
        currentQuestion = numberMatch[1];
        mode = 'q';
      } else {
        if (mode === 'q') currentQuestion += '\n' + trimmed;
        else if (mode === 'a') currentAnswer += '\n' + trimmed;
        else { currentQuestion = trimmed; mode = 'q'; }
      }
    }
  }

  if (currentQuestion && currentAnswer) {
    questions.push({ id: `q-${questions.length}`, question: currentQuestion.trim(), answer: currentAnswer.trim() });
  }

  return {
    title: 'Custom TXT Questions',
    totalQuestions: questions.length,
    sections: [{ id: 'general', title: 'General Questions', questions }],
  };
}

export function detectFormat(text: string): 'json' | 'csv' | 'txt' {
  const trimmed = text.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';

  const hasQnA = /^(?:q(?:uestion)?\s*\d*[:.-])/im.test(trimmed);
  const commaCount = (trimmed.match(/,/g) || []).length;
  const lineCount = trimmed.split('\n').length;

  if (commaCount > lineCount && !hasQnA) return 'csv';
  return 'txt';
}

export function parseQAText(text: string, format: 'auto' | 'json' | 'csv' | 'txt'): CustomQAParsedData {
  const detectedFormat = format === 'auto' ? detectFormat(text) : format;

  switch (detectedFormat) {
    case 'json':
      return parseJSON(text);
    case 'csv':
      return parseCSV(text);
    case 'txt':
      return parseTXT(text);
  }
}
