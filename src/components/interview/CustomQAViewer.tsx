'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Brain, CheckCircle, X, ChevronDown, ChevronUp,
  Upload, FileText, Sparkles, Trash2, Copy, Check,
  FileDown, Info, Bookmark, AlertCircle, RefreshCw, ArrowLeft, Plus, Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SpotlightCard } from '@/components/ui/SpotlightCard';
import { javaSampleQuestions } from '@/data/java-sample-questions';
import {
  useCustomQAQuery,
  useSaveCustomQA,
  useSaveCustomQAProgress,
  useClearCustomQA,
  useDeleteCustomQABook,
  useSelectCustomQABook,
  type CustomQABook
} from '@/hooks/use-custom-qa';

// --- Interfaces ---
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

interface QuestionProgress {
  mastered: boolean;
  flagged: boolean;
}

type ProgressMap = Record<string, QuestionProgress>;

// --- Storage Keys ---
const DATA_STORAGE_KEY = 'samundar-custom-qa-books';
const ACTIVE_SLUG_KEY = 'samundar-custom-qa-active-slug';
const PROGRESS_STORAGE_KEY = 'samundar-custom-qa-progress';

// --- Static Templates & Default Subjects ---
const PYTHON_CSV_SAMPLE = `Question,Answer
"What is the difference between list and tuple?","Lists are mutable (can be changed) and defined with square brackets []. Tuples are immutable (cannot be changed) and defined with parentheses ()."
"What is PEP 8 in Python?","PEP 8 is the official style guide for Python code. It outlines best practices for naming conventions, code layout, line spacing, indentation, and comment style."
"What are Python decorators?","Decorators are a structural design pattern that allows developers to add new functionality to an existing object (like a function or class) without modifying its structure."
"Explain list comprehensions with an example.","List comprehensions offer a shorter syntax to create a new list based on the values of an existing list. Example: \`squared = [x**2 for x in range(10)]\`."
"What is the difference between deepcopy and shallowcopy?","A shallow copy creates a new object but inserts references into the nested objects. A deep copy recursively copies everything, creating a completely independent clone."`;

const JS_TXT_SAMPLE = `Q: What are the primitive data types in JavaScript?
A: String, Number, BigInt, Boolean, Undefined, Null, and Symbol.

Q: What is the difference between let, const, and var?
A: var is function-scoped and hoisted. let and const are block-scoped, not hoisted, and reside in a temporal dead zone until declared. const variables cannot be reassigned after declaration.

Q: What is a closure in JavaScript?
A: A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In other words, a closure gives an inner function access to the outer function's scope even after the outer function has returned.

Q: What is the event loop and how does it work?
A: The event loop is a mechanism that allows JavaScript to perform non-blocking I/O operations despite being single-threaded. It constantly monitors the call stack and the callback queue; when the call stack is empty, it pushes callbacks from the queue onto the stack.`;

const DEFAULT_SUBJECTS: CustomQABook[] = [
  {
    slug: 'java-prep',
    title: 'Java Interview Prep',
    totalQuestions: javaSampleQuestions.total_questions,
    sections: javaSampleQuestions.sections as any
  },
  {
    slug: 'python-core',
    title: 'Python Core Concepts',
    totalQuestions: 5,
    sections: [
      {
        id: '1',
        title: 'Data Structures & OOP',
        questions: [
          { id: 'py1', question: 'What is the difference between list and tuple?', answer: 'Lists are mutable (can be changed) and defined with square brackets []. Tuples are immutable (cannot be changed) and defined with parentheses ().' },
          { id: 'py2', question: 'What is PEP 8 in Python?', answer: 'PEP 8 is the official style guide for Python code. It outlines best practices for naming conventions, code layout, line spacing, indentation, and comment style.' },
          { id: 'py3', question: 'What are Python decorators?', answer: 'Decorators are a structural design pattern that allows developers to add new functionality to an existing object (like a function or class) without modifying its structure.' },
          { id: 'py4', question: 'Explain list comprehensions with an example.', answer: 'List comprehensions offer a shorter syntax to create a new list based on the values of an existing list. Example: `squared = [x**2 for x in range(10)]`.' },
          { id: 'py5', question: 'What is the difference between deepcopy and shallowcopy?', answer: 'A shallow copy creates a new object but inserts references into the nested objects. A deep copy recursively copies everything, creating a completely independent clone.' }
        ]
      }
    ]
  },
  {
    slug: 'js-runtime',
    title: 'JavaScript Concurrency',
    totalQuestions: 4,
    sections: [
      {
        id: '1',
        title: 'Asynchrony & Event Loop',
        questions: [
          { id: 'js1', question: 'What are the primitive data types in JavaScript?', answer: 'String, Number, BigInt, Boolean, Undefined, Null, and Symbol.' },
          { id: 'js2', question: 'What is the difference between let, const, and var?', answer: 'var is function-scoped and hoisted. let and const are block-scoped, not hoisted, and reside in a temporal dead zone until declared. const variables cannot be reassigned after declaration.' },
          { id: 'js3', question: 'What is a closure in JavaScript?', answer: 'A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In other words, a closure gives an inner function access to the outer function\'s scope even after the outer function has returned.' },
          { id: 'js4', question: 'What is the event loop and how does it work?', answer: 'The event loop is a mechanism that allows JavaScript to perform non-blocking I/O operations despite being single-threaded. It constantly monitors the call stack and the callback queue; when the call stack is empty, it pushes callbacks from the queue onto the stack.' }
        ]
      }
    ]
  }
];

// Aesthetic gradients for subjects
const SUBJECT_STYLING: Record<string, { gradient: string; glow: string; topics: string[] }> = {
  'java-prep': {
    gradient: 'from-orange-500 via-amber-600 to-yellow-500',
    glow: 'rgba(249, 115, 22, 0.12)',
    topics: ['OOP Pillars', 'Collections', 'Multithreading', 'JVM Internals']
  },
  'python-core': {
    gradient: 'from-blue-500 via-indigo-650 to-cyan-500',
    glow: 'rgba(59, 130, 246, 0.12)',
    topics: ['Data Structures', 'Decorators', 'Memory Copies']
  },
  'js-runtime': {
    gradient: 'from-yellow-400 via-amber-500 to-orange-400',
    glow: 'rgba(234, 179, 8, 0.12)',
    topics: ['Event Loop', 'Closures', 'Scopes', 'Hoisting']
  }
};

export default function CustomQAViewer() {
  const { data: dbData, isLoading: isDbLoading } = useCustomQAQuery();
  const saveCustomQADb = useSaveCustomQA();
  const selectBookDb = useSelectCustomQABook();
  const deleteBookDb = useDeleteCustomQABook();
  const saveProgressDb = useSaveCustomQAProgress();
  const clearCustomQADb = useClearCustomQA();

  const [inputText, setInputText] = React.useState('');
  const [format, setFormat] = React.useState<'auto' | 'json' | 'csv' | 'txt'>('auto');
  const [search, setSearch] = React.useState('');
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = React.useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  // Custom uploaded subjects state
  const [customBooks, setCustomBooks] = React.useState<CustomQABook[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(DATA_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
  });

  // Active Subject Slug state
  const [activeSubjectSlug, setActiveSubjectSlug] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_SLUG_KEY);
    }
    return null;
  });

  // Question progress flags
  const [progress, setProgress] = React.useState<ProgressMap>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return {};
  });

  // Compile active list of subjects
  const allSubjects = React.useMemo(() => {
    return [...DEFAULT_SUBJECTS, ...customBooks];
  }, [customBooks]);

  // Find active subject data
  const activeSubject = React.useMemo(() => {
    return allSubjects.find(s => s.slug === activeSubjectSlug) || null;
  }, [allSubjects, activeSubjectSlug]);

  // Expand sections of active subject on mount/select
  React.useEffect(() => {
    if (activeSubject) {
      const initialSections: Record<string, boolean> = {};
      activeSubject.sections.forEach((sec) => {
        initialSections[String(sec.id)] = true;
      });
      setExpandedSections((prev) => ({ ...initialSections, ...prev }));
    }
  }, [activeSubjectSlug]);

  // Save active slug to localStorage
  const handleSelectSubject = (slug: string | null) => {
    setActiveSubjectSlug(slug);
    if (slug) {
      localStorage.setItem(ACTIVE_SLUG_KEY, slug);
      if (dbData?.dbConnected && !DEFAULT_SUBJECTS.some(d => d.slug === slug)) {
        selectBookDb.mutate(slug);
      }
    } else {
      localStorage.removeItem(ACTIVE_SLUG_KEY);
    }
  };

  // Sync state with DB when loaded
  React.useEffect(() => {
    if (dbData && dbData.dbConnected) {
      if (dbData.data && Array.isArray(dbData.data.books)) {
        setCustomBooks(dbData.data.books);
        localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(dbData.data.books));
        
        // Auto-select DB's active book if it matches a custom book
        if (dbData.data.activeBookSlug && !activeSubjectSlug) {
          const exists = [...DEFAULT_SUBJECTS, ...dbData.data.books].some(b => b.slug === dbData.data!.activeBookSlug);
          if (exists) {
            setActiveSubjectSlug(dbData.data.activeBookSlug);
            localStorage.setItem(ACTIVE_SLUG_KEY, dbData.data.activeBookSlug);
          }
        }
      }
      if (dbData.progress) {
        setProgress((prev) => ({ ...prev, ...dbData.progress }));
      }
    }
  }, [dbData]);

  // Save progress
  const saveProgress = (newProgress: ProgressMap) => {
    setProgress(newProgress);
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(newProgress));
    if (dbData?.dbConnected) {
      saveProgressDb.mutate(newProgress);
    }
  };

  // Split CSV line helper
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

  // Parsers Engine
  const handleParse = (textToParse: string = inputText, selectedFormat: typeof format = format) => {
    if (!textToParse.trim()) {
      setParseError('Please paste some data or upload a file first.');
      return;
    }
    setParseError(null);

    let detectedFormat: 'json' | 'csv' | 'txt' = 'json';

    if (selectedFormat === 'auto') {
      const trimmed = textToParse.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        detectedFormat = 'json';
      } else {
        const hasQnA = /^(?:q(?:uestion)?\s*\d*[:.-])/im.test(trimmed);
        const commaCount = (trimmed.match(/,/g) || []).length;
        const lineCount = trimmed.split('\n').length;
        if (commaCount > lineCount && !hasQnA) {
          detectedFormat = 'csv';
        } else {
          detectedFormat = 'txt';
        }
      }
    } else {
      detectedFormat = selectedFormat;
    }

    try {
      let result: CustomQAParsedData;

      if (detectedFormat === 'json') {
        const parsedJson = JSON.parse(textToParse);
        
        if (parsedJson && typeof parsedJson === 'object' && Array.isArray(parsedJson.sections)) {
          const sections: CustomSection[] = parsedJson.sections.map((sec: any, idx: number) => ({
            id: sec.section || sec.id || `sec-${idx}`,
            title: sec.title || `Section ${idx + 1}`,
            questions: (sec.questions || []).map((q: any, qIdx: number) => ({
              id: String(q.id || `q-${idx}-${qIdx}`),
              question: String(q.question || q.q || ''),
              answer: String(q.answer || q.a || '')
            })).filter((q: any) => q.question)
          }));
          
          result = {
            title: parsedJson.title || 'Custom Imported Q&A',
            totalQuestions: sections.reduce((acc, s) => acc + s.questions.length, 0),
            sections
          };
        } else if (Array.isArray(parsedJson)) {
          const questions: CustomQuestion[] = parsedJson.map((q: any, idx: number) => ({
            id: String(q.id || `q-${idx}`),
            question: String(q.question || q.q || ''),
            answer: String(q.answer || q.a || '')
          })).filter(q => q.question);

          result = {
            title: 'Custom Imported Q&A',
            totalQuestions: questions.length,
            sections: [{ id: 'general', title: 'General Questions', questions }]
          };
        } else {
          throw new Error('Unsupported JSON format.');
        }
      } else if (detectedFormat === 'csv') {
        const lines = textToParse.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
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
            answer: columns[answerColIndex] || ''
          };
        }).filter(q => q.question);

        result = {
          title: 'Custom CSV Questions',
          totalQuestions: questions.length,
          sections: [{ id: 'general', title: 'General Questions', questions }]
        };
      } else {
        const lines = textToParse.split(/\r?\n/);
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

        result = {
          title: 'Custom TXT Questions',
          totalQuestions: questions.length,
          sections: [{ id: 'general', title: 'General Questions', questions }]
        };
      }

      if (result.totalQuestions === 0) throw new Error('No valid questions parsed.');

      const customSlug = 'custom-' + result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newBook: CustomQABook = {
        slug: customSlug,
        title: result.title,
        totalQuestions: result.totalQuestions,
        sections: result.sections
      };

      // Add to customBooks list
      const updatedBooks = [...customBooks.filter(b => b.slug !== customSlug), newBook];
      setCustomBooks(updatedBooks);
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(updatedBooks));

      if (dbData?.dbConnected) {
        saveCustomQADb.mutate(newBook);
      }

      handleSelectSubject(customSlug);
      setImportOpen(false);
      setInputText('');
    } catch (e: any) {
      setParseError(e.message || 'Formatting failed.');
    }
  };

  // Subject deletion
  const handleDeleteSubject = (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm('Are you sure you want to delete this custom subject? This action will permanently remove it from database.')) {
      const updatedBooks = customBooks.filter(b => b.slug !== slug);
      setCustomBooks(updatedBooks);
      localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(updatedBooks));

      if (dbData?.dbConnected) {
        deleteBookDb.mutate(slug);
      }

      if (activeSubjectSlug === slug) {
        handleSelectSubject(null);
      }
    }
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') setFormat('json');
      else if (ext === 'csv') setFormat('csv');
      else if (ext === 'txt') setFormat('txt');

      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        handleParse(text, ext as any || 'auto');
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'json') setFormat('json');
      else if (ext === 'csv') setFormat('csv');
      else if (ext === 'txt') setFormat('txt');

      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text);
        handleParse(text, ext as any || 'auto');
      };
      reader.readAsText(file);
    }
  };

  // Load sample template into text area
  const loadSample = (type: 'java' | 'python' | 'javascript') => {
    let text = '';
    if (type === 'java') {
      text = JSON.stringify(javaSampleQuestions, null, 2);
      setFormat('json');
    } else if (type === 'python') {
      text = PYTHON_CSV_SAMPLE;
      setFormat('csv');
    } else {
      text = JS_TXT_SAMPLE;
      setFormat('txt');
    }
    setInputText(text);
  };

  // Expand / Collapse Question & Sections
  const toggleQuestion = (id: string) => {
    setExpandedQuestions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSection = (id: string | number) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    if (!activeSubject) return;
    const all: Record<string, boolean> = {};
    activeSubject.sections.forEach(sec => {
      sec.questions.forEach(q => {
        all[q.id] = true;
      });
    });
    setExpandedQuestions(all);
  };

  const collapseAll = () => {
    setExpandedQuestions({});
  };

  // Mastery actions
  const toggleMastery = (qText: string) => {
    const key = qText.trim();
    const current = progress[key] || { mastered: false, flagged: false };
    const updated = {
      ...progress,
      [key]: { ...current, mastered: !current.mastered }
    };
    saveProgress(updated);
  };

  const toggleFlagged = (qText: string) => {
    const key = qText.trim();
    const current = progress[key] || { mastered: false, flagged: false };
    const updated = {
      ...progress,
      [key]: { ...current, flagged: !current.flagged }
    };
    saveProgress(updated);
  };

  const copyAnswer = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export selected subject
  const handleExportSubject = () => {
    if (!activeSubject) return;
    const exportObject = {
      ...activeSubject,
      exportedAt: new Date().toISOString(),
      userProgress: Object.entries(progress).map(([questionText, status]) => ({
        question: questionText,
        ...status
      }))
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeSubject.slug}-study-bank.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Calculate subject progress dynamically
  const getSubjectStats = React.useCallback((subject: CustomQABook) => {
    let total = 0;
    let mastered = 0;
    let flagged = 0;
    subject.sections.forEach(sec => {
      sec.questions.forEach(q => {
        total++;
        const prog = progress[q.question.trim()];
        if (prog?.mastered) mastered++;
        if (prog?.flagged) flagged++;
      });
    });
    return {
      total,
      mastered,
      flagged,
      pct: total > 0 ? Math.round((mastered / total) * 100) : 0
    };
  }, [progress]);

  // Filtering list
  const getFilteredQuestions = (questions: CustomQuestion[]) => {
    return questions.filter(q => {
      const qText = q.question.toLowerCase();
      const aText = q.answer.toLowerCase();
      const query = search.toLowerCase().trim();
      return qText.includes(query) || aText.includes(query);
    });
  };

  // Highlights search matched text
  function HighlightedText({ text, search }: { text: string; search: string }) {
    if (!search.trim()) return <span className="whitespace-pre-line">{text}</span>;
    const regex = new RegExp(`(${search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <span className="whitespace-pre-line">
        {parts.map((part, i) =>
          regex.test(part) ? (
            <mark key={i} className="bg-amber-500/30 text-amber-200 rounded px-0.5 font-medium">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  }

  // Answer format parser
  function AnswerFormatter({ text, search }: { text: string; search: string }) {
    const parts = text.split(/(`[^`]+`)/g);
    return (
      <p className="text-sm text-zinc-300 leading-relaxed">
        {parts.map((part, idx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={idx} className="bg-zinc-950 px-1.5 py-0.5 rounded font-mono text-xs text-indigo-300 border border-zinc-800">
                {part.slice(1, -1)}
              </code>
            );
          }
          return <HighlightedText key={idx} text={part} search={search} />;
        })}
      </p>
    );
  }

  // Dynamic values for active subject
  const activeStats = React.useMemo(() => {
    if (!activeSubject) return { total: 0, mastered: 0, flagged: 0, pct: 0 };
    return getSubjectStats(activeSubject);
  }, [activeSubject, getSubjectStats]);

  // Loading skeleton state
  if (isDbLoading && customBooks.length === 0) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-zinc-900 rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 w-full bg-zinc-900/30 rounded-xl border border-zinc-850 p-6 flex flex-col justify-between animate-pulse">
              <div className="space-y-2.5">
                <div className="h-4 w-1/3 bg-zinc-850 rounded" />
                <div className="h-3 w-2/3 bg-zinc-850 rounded" />
              </div>
              <div className="h-3 w-full bg-zinc-850 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Grid View of Subjects ──────────────────────────────── */}
      {!activeSubjectSlug ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" />
                Study Subjects
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Select an interview question bank to begin studying.</p>
            </div>
            
            {/* Sync Badge */}
            {dbData?.dbConnected ? (
              <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-full px-2 py-0.5 font-medium flex items-center gap-1 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                DB Synced
              </span>
            ) : (
              <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-900/50 rounded-full px-2 py-0.5 font-medium flex items-center gap-1 select-none">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Local Cache
              </span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {allSubjects.map((subject, index) => {
              const styling = SUBJECT_STYLING[subject.slug] || {
                gradient: 'from-indigo-500 via-purple-650 to-violet-500',
                glow: 'rgba(99, 102, 241, 0.12)',
                topics: subject.sections.map(s => s.title).slice(0, 3)
              };
              
              const stats = getSubjectStats(subject);
              const isCustom = !DEFAULT_SUBJECTS.some(d => d.slug === subject.slug);

              return (
                <motion.div
                  key={subject.slug}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative cursor-pointer"
                  onClick={() => handleSelectSubject(subject.slug)}
                >
                  <SpotlightCard 
                    className="h-full hover:border-zinc-700/80 transition-all duration-300 relative overflow-hidden" 
                    spotlightColor={styling.glow}
                  >
                    <div className="flex flex-col justify-between h-full space-y-5">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-base font-bold text-zinc-100 group-hover:text-white transition-colors duration-200">
                            {subject.title}
                          </h3>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] bg-zinc-950/40 text-zinc-400 border-zinc-800">
                              {subject.totalQuestions} Questions
                            </Badge>
                            {isCustom && (
                              <button
                                onClick={(e) => handleDeleteSubject(e, subject.slug)}
                                className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-all duration-200 shrink-0"
                                title="Delete Subject"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Topic Tags */}
                      <div className="flex flex-wrap gap-1.5 min-h-[48px]">
                        {styling.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>

                      {/* Progress bar */}
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-semibold text-zinc-500">Mastery Progress</span>
                          <span className="text-[10px] font-bold text-zinc-300">{stats.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden border border-zinc-900">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${styling.gradient} transition-all duration-500`}
                            style={{ width: `${stats.pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </SpotlightCard>
                </motion.div>
              );
            })}

            {/* Import Card Creator */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: allSubjects.length * 0.05 }}
              className="cursor-pointer"
              onClick={() => setImportOpen(!importOpen)}
            >
              <Card className="h-full border border-dashed border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/25 hover:border-zinc-700 transition-all duration-300 flex flex-col items-center justify-center p-6 min-h-[170px]">
                <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 mb-2 group-hover:text-zinc-300 transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-bold text-zinc-300">Import New Q&A Subject</h4>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-[200px] text-center">Paste raw data or drag & drop files (.json, .csv, .txt)</p>
              </Card>
            </motion.div>
          </div>

          {/* Collapsible Upload Panel inside Subject List */}
          <AnimatePresence>
            {importOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Card className="border-zinc-800 bg-zinc-950/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-300">Upload Q&A File</h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setImportOpen(false)}>
                      <X className="h-4 w-4 text-zinc-500" />
                    </Button>
                  </div>

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={`border border-dashed rounded-lg p-5 text-center flex flex-col items-center justify-center transition-all ${
                      isDragActive ? 'border-indigo-500 bg-indigo-950/10 text-indigo-300' : 'border-zinc-850 bg-zinc-950/30 text-zinc-400 hover:border-zinc-750'
                    }`}
                  >
                    <input type="file" id="file-upload" accept=".json,.csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                      <FileText className="h-7 w-7 text-zinc-500 mb-1" />
                      <span className="text-xs text-zinc-300 font-medium">Drag & drop file here, or <span className="text-indigo-400 underline">browse</span></span>
                    </label>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-zinc-400">Or Paste Text Directly</label>
                      <div className="flex gap-1.5">
                        <button onClick={() => loadSample('java')} className="text-[9px] font-semibold text-indigo-400 hover:text-indigo-300 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">Java (JSON)</button>
                        <button onClick={() => loadSample('python')} className="text-[9px] font-semibold text-emerald-400 hover:text-emerald-300 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">Python (CSV)</button>
                        <button onClick={() => loadSample('javascript')} className="text-[9px] font-semibold text-amber-400 hover:text-amber-300 bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5">JS (TXT)</button>
                      </div>
                    </div>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder='Paste JSON array of questions, CSV text, or plain Q: & A: blocks...'
                      rows={6}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-lg p-2.5 text-xs font-mono text-zinc-300 outline-none focus:border-zinc-700 placeholder:text-zinc-700"
                    />
                  </div>

                  {/* Parse Row */}
                  <div className="flex items-center justify-between gap-3 bg-zinc-900/30 p-2 rounded-lg border border-zinc-900">
                    <div className="flex gap-1">
                      {(['auto', 'json', 'csv', 'txt'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setFormat(fmt)}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded capitalize ${format === fmt ? 'bg-indigo-600 text-white' : 'bg-zinc-905 border border-zinc-800 text-zinc-400'}`}
                        >
                          {fmt === 'auto' ? 'Auto' : fmt}
                        </button>
                      ))}
                    </div>
                    <Button size="sm" onClick={() => handleParse()} disabled={!inputText.trim()} className="bg-indigo-650 hover:bg-indigo-500 text-white text-xs h-7 px-3">
                      Parse & Import Card
                    </Button>
                  </div>

                  {parseError && (
                    <div className="flex items-start gap-2 bg-red-950/20 border border-red-900/40 rounded-lg p-2.5 text-xs text-red-400">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <p className="font-mono text-[10px] text-zinc-400 leading-normal">{parseError}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ─── Question Table List View ────────────────────────────── */
        activeSubject && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSelectSubject(null)}
                className="h-8 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 px-2"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Subjects
              </Button>
            </div>

            {/* Title / Info Row */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-400" />
                  {activeSubject.title}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  Active workbook loaded with {activeSubject.sections.length} section{activeSubject.sections.length !== 1 ? 's' : ''} and {activeStats.total} questions.
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-xs gap-1">
                  <ChevronDown className="h-3.5 w-3.5" /> Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-xs gap-1">
                  <ChevronUp className="h-3.5 w-3.5" /> Collapse All
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportSubject} className="h-8 text-xs gap-1 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/20 border-indigo-900/50">
                  <FileDown className="h-3.5 w-3.5" /> Export Book
                </Button>
              </div>
            </div>

            {/* Stats Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-zinc-850 bg-zinc-900/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-zinc-500 font-medium">Questions</p>
                  <p className="text-lg font-bold text-zinc-100 mt-0.5">{activeStats.total}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-850 bg-zinc-900/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-zinc-500 font-medium">Mastered</p>
                  <p className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
                    <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
                    {activeStats.mastered}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-zinc-850 bg-zinc-900/30">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-zinc-500 font-medium">Flagged</p>
                  <p className="text-lg font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                    <Bookmark className="h-4 w-4 fill-amber-500/10" />
                    {activeStats.flagged}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress line */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-500 font-medium px-0.5">
                <span>Subject Progress</span>
                <span>{activeStats.pct}% completed ({activeStats.mastered}/{activeStats.total} mastered)</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900 p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{ width: `${activeStats.pct}%` }}
                />
              </div>
            </div>

            {/* Search Filter input */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search questions or answers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-650 animate-fade-in"
              />
            </div>

            {/* Table Questions List */}
            <div className="space-y-6">
              {activeSubject.sections.map((section) => {
                const matchedQs = getFilteredQuestions(section.questions);
                if (matchedQs.length === 0) return null;

                const isSectionExpanded = expandedSections[String(section.id)] !== false;

                return (
                  <div key={section.id} className="space-y-3">
                    {/* Section Header Accordion */}
                    <div 
                      onClick={() => toggleSection(section.id)}
                      className="flex items-center justify-between border-b border-zinc-850 pb-2 cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-600 bg-zinc-900 border border-zinc-850 rounded px-1.5 py-0.5">
                          Section
                        </span>
                        <h3 className="text-sm font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">
                          {section.title}
                        </h3>
                        <Badge variant="outline" className="bg-zinc-950/40 text-zinc-500 border-zinc-850 text-[9px] font-semibold px-1.5 py-0">
                          {matchedQs.length} Q{matchedQs.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 group-hover:bg-zinc-800/40">
                        {isSectionExpanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                      </Button>
                    </div>

                    {/* Questions Cards */}
                    {isSectionExpanded && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {matchedQs.map((q, idx) => {
                          const isExpanded = !!expandedQuestions[q.id];
                          const prog = progress[q.question.trim()] || { mastered: false, flagged: false };
                          
                          return (
                            <Card 
                              key={q.id} 
                              className={`border transition-all duration-300 ${
                                isExpanded ? 'border-zinc-700 bg-zinc-900/60 shadow-md' : 'border-zinc-850 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-800'
                              }`}
                            >
                              <CardContent className="p-3.5 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div 
                                    onClick={() => toggleQuestion(q.id)}
                                    className="flex-1 min-w-0 flex items-start gap-2.5 cursor-pointer"
                                  >
                                    <span className="text-xs font-semibold text-zinc-500 mt-0.5">{idx + 1}.</span>
                                    <div className="text-sm font-medium text-zinc-200 leading-relaxed pr-2">
                                      <HighlightedText text={q.question} search={search} />
                                    </div>
                                  </div>

                                  {/* Buttons status indicators */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => toggleMastery(q.question)}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        prog.mastered ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400' : 'border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400'
                                      }`}
                                      title="Mark Mastered"
                                    >
                                      <CheckCircle className={`h-3.5 w-3.5 ${prog.mastered ? 'fill-emerald-500/10' : ''}`} />
                                    </button>

                                    <button
                                      onClick={() => toggleFlagged(q.question)}
                                      className={`p-1.5 rounded-lg border transition-all ${
                                        prog.flagged ? 'bg-amber-950/40 border-amber-800 text-amber-400' : 'border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-400'
                                      }`}
                                      title="Flag Review"
                                    >
                                      <Bookmark className={`h-3.5 w-3.5 ${prog.flagged ? 'fill-amber-500/10' : ''}`} />
                                    </button>

                                    <button
                                      onClick={() => toggleQuestion(q.id)}
                                      className="p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200"
                                    >
                                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </div>

                                {/* Collapsible answer */}
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
                                        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold select-none">
                                          <span className="flex items-center gap-1 text-indigo-400"><Info className="h-3 w-3" /> Answer Key</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyAnswer(q.id, q.answer)}
                                            className="h-6 gap-1 text-zinc-550 hover:text-zinc-300 hover:bg-zinc-800 px-1.5"
                                          >
                                            {copiedId === q.id ? (
                                              <><Check className="h-3 w-3 text-emerald-400" /><span>Copied</span></>
                                            ) : (
                                              <><Copy className="h-3 w-3" /><span>Copy Answer</span></>
                                            )}
                                          </Button>
                                        </div>
                                        <div className="bg-zinc-950/40 p-3 rounded-lg border border-zinc-850/60">
                                          <AnswerFormatter text={q.answer} search={search} />
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Empty search */}
              {search.trim() && !activeSubject.sections.some(s => getFilteredQuestions(s.questions).length > 0) && (
                <div className="text-center py-10">
                  <Search className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No questions matched search text.</p>
                  <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="mt-2 text-indigo-455 hover:text-indigo-300 text-xs">Clear Search</Button>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
