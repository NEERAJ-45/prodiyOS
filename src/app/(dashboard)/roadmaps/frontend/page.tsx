'use client';

import * as React from 'react';
import { Clock, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const QuestionsTable = dynamic(() => import('@/components/roadmaps/QuestionsTable'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-zinc-500">Loading JavaScript topics...</p>
    </div>
  ),
});

interface QuestionItem {
  id: number;
  title: string;
  difficulty: string;
  link: string;
}

const coreTitles = [
  'What is the Execution Context and what are its phases?',
  'Understanding the Call Stack and how JS executes code',
  'Lexical Scope vs Dynamic Scope in JavaScript',
  'var vs let vs const: Scoping differences explained',
  'Hoisting in JavaScript: Variables, functions, and the Temporal Dead Zone',
  'Primitive Types vs Reference Types in JavaScript',
  'Type Coercion: == vs === and how JS compares values',
  'Truthy and Falsy values: The complete list',
  'Function Declarations vs Function Expressions vs Arrow Functions',
  'Arrow Functions: Key differences beyond syntax (this, arguments, prototype)',
  'IIFE (Immediately Invoked Function Expressions) and their use cases',
  'Closures in JavaScript: How they work and why they matter',
  'The classic var vs let closure problem in loops with setTimeout',
  'Understanding this keyword: Global, function, and method context',
  'call, apply, and bind: Explicit function binding',
  'Prototype Chain and Prototypal Inheritance',
  '__proto__ vs prototype: Clearing the confusion',
  'ES6 Classes: Syntactic sugar over prototypes',
  'extends and super in JavaScript classes',
  'Object Property Descriptors: writable, enumerable, configurable',
  'Object.freeze vs Object.seal vs Object.preventExtensions',
  'Shallow Copy vs Deep Copy: Spread, Object.assign, structuredClone',
  'Destructuring Objects and Arrays with defaults',
  'Optional Chaining (?.) and Nullish Coalescing (??)',
  'Array Methods Deep Dive: map, filter, reduce, find, some, every',
  'The Event Loop: Call Stack, Microtask Queue, and Macrotask Queue',
  'Execution Order: Synchronous code, Microtasks, and Macrotasks',
  'Callbacks and the problem of Callback Hell',
  'Promises: States, Chaining, and Error Propagation',
  'Promise.all vs Promise.race vs Promise.allSettled vs Promise.any',
  'async/await: How it desugars to Promises under the hood',
  'Error Handling in Async Code: try/catch and unhandled rejections',
  'CommonJS vs ES Modules: import/export differences',
  'Map and Set vs Object and Array: When to use which',
  'WeakMap and WeakSet: Purpose and garbage collection benefits',
  'Symbols in JavaScript: What they are and why they exist',
  'Iterators and the Iterator Protocol',
  'Generators: function* and yield explained',
  'Garbage Collection in JavaScript: Mark-and-Sweep algorithm',
  'Common Memory Leak Patterns in JavaScript',
  'Debouncing vs Throttling: Concepts and implementation',
  'Event Delegation, Bubbling, and Capturing',
  'Custom Error Classes: Extending the Error object',
  'Currying and Partial Application in JavaScript',
  'Pure Functions and the concept of Side Effects',
  'Implementing Polyfills: bind, call, apply, and Promise.all from scratch'
];

const advancedTitles = [
  'Event Object Deep Dive: preventDefault, stopPropagation, stopImmediatePropagation',
  'addEventListener options: capture, once, passive',
  'DOM Traversal and Manipulation basics (parentNode, childNodes, closest)',
  'requestAnimationFrame vs setTimeout for animations',
  'Intersection Observer and Mutation Observer APIs',
  'Fetch API: Request/Response objects, headers, and error handling',
  'AbortController: Cancelling fetch requests',
  'CORS from a JavaScript perspective: Preflight requests, common errors',
  'Cross-Site Scripting (XSS): How it happens and how JS code prevents it',
  'Prototype Pollution: What it is and how to guard against it',
  'eval() and new Function(): Why they are dangerous',
  'Content Security Policy (CSP) basics as it relates to JS execution',
  'Array.at(), structuredClone(), and other recent ES additions',
  'Logical Assignment Operators: ||=, &&=, ??=',
  'Private Class Fields (#field) in JavaScript classes',
  'Optional Catch Binding: try {} catch {} without an error param',
  'Top-level await in ES Modules',
  'JIT Compilation Basics: How V8 optimizes JavaScript (hidden classes, inline caching)',
  'Testing Fundamentals: Writing testable JS (pure functions, dependency injection)',
  'Mocking in Jest/Vitest: Spies, mocks, and stubs explained'
];

const drillTitles = [
  'Implement debounce and throttle from scratch',
  'Implement Promise.all and Promise.race polyfills from scratch',
  'Implement bind, call, and apply polyfills from scratch',
  'Implement Deep Clone from scratch',
  'Implement curry from scratch',
  'Implement EventEmitter from scratch',
  'Implement Array.prototype.map and Array.prototype.reduce polyfills from scratch'
];

function getLinkForTopic(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('execution context')) return 'https://javascript.info/closure';
  if (t.includes('call stack')) return 'https://developer.mozilla.org/en-US/docs/Glossary/Call_stack';
  if (t.includes('lexical scope')) return 'https://javascript.info/closure';
  if (t.includes('var vs let')) return 'https://javascript.info/variables';
  if (t.includes('hoisting')) return 'https://developer.mozilla.org/en-US/docs/Glossary/Hoisting';
  if (t.includes('primitive types')) return 'https://javascript.info/object-copy';
  if (t.includes('coercion')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness';
  if (t.includes('truthy')) return 'https://developer.mozilla.org/en-US/docs/Glossary/Falsy';
  if (t.includes('declarations vs')) return 'https://javascript.info/function-expressions';
  if (t.includes('arrow functions')) return 'https://javascript.info/arrow-functions';
  if (t.includes('iife')) return 'https://developer.mozilla.org/en-US/docs/Glossary/IIFE';
  if (t.includes('closures')) return 'https://javascript.info/closure';
  if (t.includes('timeout') || t.includes('interval')) return 'https://javascript.info/settimeout-setinterval';
  if (t.includes('this keyword') || t.includes('understanding this')) return 'https://javascript.info/object-methods';
  if (t.includes('call, apply')) return 'https://javascript.info/bind';
  if (t.includes('prototype')) return 'https://javascript.info/prototypes';
  if (t.includes('classes')) return 'https://javascript.info/classes';
  if (t.includes('freeze')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze';
  if (t.includes('shallow copy')) return 'https://javascript.info/object-copy';
  if (t.includes('destructuring')) return 'https://javascript.info/destructuring-assignment';
  if (t.includes('optional chaining')) return 'https://javascript.info/optional-chaining';
  if (t.includes('array methods')) return 'https://javascript.info/array-methods';
  if (t.includes('event loop')) return 'https://javascript.info/event-loop';
  if (t.includes('promises')) return 'https://javascript.info/promise-basics';
  if (t.includes('promise.')) return 'https://javascript.info/promise-api';
  if (t.includes('async/await')) return 'https://javascript.info/async-await';
  if (t.includes('modules')) return 'https://javascript.info/modules-intro';
  if (t.includes('map and set')) return 'https://javascript.info/map-set';
  if (t.includes('weakmap')) return 'https://javascript.info/weakmap-weakset';
  if (t.includes('symbols')) return 'https://javascript.info/symbol';
  if (t.includes('generators')) return 'https://javascript.info/generators';
  if (t.includes('garbage collection')) return 'https://javascript.info/garbage-collection';
  if (t.includes('debounc') || t.includes('throttl')) return 'https://javascript.info/settimeout-setinterval';
  if (t.includes('delegation')) return 'https://javascript.info/event-delegation';
  if (t.includes('currying')) return 'https://javascript.info/currying';
  if (t.includes('pure functions')) return 'https://medium.com/javascript-scene/master-the-javascript-interview-what-is-a-pure-function-d1c8d35d64e5';
  if (t.includes('polyfills')) return 'https://javascript.info/polyfills';
  
  if (t.includes('event object')) return 'https://developer.mozilla.org/en-US/docs/Web/API/Event';
  if (t.includes('addeventlistener')) return 'https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener';
  if (t.includes('dom traversal')) return 'https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction';
  if (t.includes('requestanimationframe')) return 'https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame';
  if (t.includes('observer')) return 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API';
  if (t.includes('fetch api')) return 'https://javascript.info/fetch';
  if (t.includes('abortcontroller')) return 'https://javascript.info/fetch-abort';
  if (t.includes('cors')) return 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS';
  if (t.includes('xss') || t.includes('cross-site')) return 'https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting';
  if (t.includes('pollution')) return 'https://learn.snyk.io/lessons/prototype-pollution/javascript/';
  if (t.includes('eval(')) return 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval';
  if (t.includes('csp') || t.includes('content security')) return 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP';
  if (t.includes('jit') || t.includes('v8')) return 'https://v8.dev/';
  if (t.includes('testing')) return 'https://jestjs.io/docs/getting-started';
  if (t.includes('mocking')) return 'https://jestjs.io/docs/mock-functions';

  return 'https://javascript.info/';
}

const javascriptQuestions: QuestionItem[] = [
  ...coreTitles.map((title, idx) => ({
    id: 701 + idx,
    title,
    difficulty: idx % 3 === 0 ? 'EASY' : (idx % 3 === 1 ? 'MEDIUM' : 'HARD'),
    link: getLinkForTopic(title)
  })),
  ...advancedTitles.map((title, idx) => ({
    id: 747 + idx,
    title,
    difficulty: 'HARD',
    link: getLinkForTopic(title)
  })),
  ...drillTitles.map((title, idx) => ({
    id: 767 + idx,
    title,
    difficulty: 'ADVANCED',
    link: getLinkForTopic(title)
  }))
];


const pillars = [
  {
    name: 'JavaScript Fundamentals',
    slug: 'javascript',
    progress: 0,
    hours: 80,
    difficulty: 'Medium' as const,
    color: 'from-amber-500 to-yellow-400',
    domains: [
      { name: 'Core JS & Mechanics', progress: 0, modules: ['Execution Context', 'Hoisting', 'Closures', 'Prototypes'] },
      { name: 'Advanced & Async', progress: 0, modules: ['Event Loop', 'Security', 'Engine Internals', 'Drills'] },
    ],
  },
  {
    name: 'React',
    slug: 'react',
    progress: 0,
    hours: 90,
    difficulty: 'Medium' as const,
    color: 'from-sky-500 to-cyan-400',
    domains: [
      { name: 'Core React', progress: 0, modules: ['Components', 'Hooks', 'Context', 'Refs'] },
      { name: 'Ecosystem & Next.js', progress: 0, modules: ['Next.js', 'React Query', 'Zustand'] },
    ],
  },
  {
    name: 'Next.js',
    slug: 'nextjs',
    progress: 0,
    hours: 90,
    difficulty: 'Medium-Hard' as const,
    color: 'from-cyan-500 to-teal-400',
    domains: [
      { name: 'Routing & Pages', progress: 0, modules: ['App Router', 'Nested Layouts', 'Dynamic Routes'] },
      { name: 'Server & Rendering', progress: 0, modules: ['RSC vs RCC', 'Server Actions', 'Edge API'] },
    ],
  },
  {
    name: 'MicroFrontends',
    slug: 'microfrontends',
    progress: 0,
    hours: 80,
    difficulty: 'Hard' as const,
    color: 'from-indigo-500 to-purple-500',
    domains: [
      { name: 'Orchestration & Federation', progress: 0, modules: ['Module Federation', 'Single-SPA', 'SystemJS'] },
      { name: 'Communication & Isolation', progress: 0, modules: ['postMessage', 'Shadow DOM', 'State Sync'] },
    ],
  },
  {
    name: 'Machine Coding',
    slug: 'machine-coding',
    progress: 0,
    hours: 100,
    difficulty: 'Medium-Hard' as const,
    color: 'from-rose-500 to-pink-400',
    domains: [
      { name: 'Beginner Components', progress: 0, modules: ['Accordion', 'Contact Form', 'Holy Grail', 'Progress Bars'] },
      { name: 'Intermediate & Advanced', progress: 0, modules: ['Tabs', 'File Explorer', 'Wordle', 'Image Carousel'] },
    ],
  },
];

const difficultyColors: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  'Medium-Hard': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  Hard: 'bg-red-500/15 text-red-400 border-red-500/30',
};

function RoadmapCard({
  pillar,
}: {
  pillar: (typeof pillars)[0];
}) {
  return (
    <Link href={`/roadmaps/frontend/${pillar.slug}`} className="block">
      <Card
        className="group cursor-pointer border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700 hover:bg-zinc-900 h-full flex flex-col justify-between"
      >
        <CardHeader className="p-5 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-zinc-100 group-hover:text-zinc-50 transition-colors">
                {pillar.name}
              </CardTitle>
              <div className="flex items-center gap-3 mt-2">
                <Badge
                  variant="secondary"
                  className={cn('text-xs font-medium border', difficultyColors[pillar.difficulty])}
                >
                  {pillar.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-zinc-400">
                  <Clock className="h-3 w-3" />
                  {pillar.hours}h
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-3">
              <span className="text-sm font-semibold text-zinc-200">{pillar.progress}%</span>
              <ArrowRight className="h-4 w-4 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-zinc-300" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 pt-0 mt-auto">
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-650 transition-all duration-500"
              style={{ width: `${pillar.progress}%` }}
            />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function FrontendRoadmapPage() {
  const [progressData, setProgressData] = React.useState({
    javascript: { overall: 0, core: 0, advanced: 0 },
    react: { overall: 0, core: 0, nextjs: 0 },
    nextjs: { overall: 0, routing: 0, rendering: 0 },
    mfe: { overall: 0, orchestration: 0, isolation: 0 },
    machineCoding: { overall: 0, beginner: 0, advanced: 0 }
  });

  React.useEffect(() => {
    const getCompletedCountInRange = (prefix: string, rangeStart: number, rangeEnd: number) => {
      try {
        const raw = localStorage.getItem(`${prefix}-completed`);
        if (!raw) return 0;
        const data = JSON.parse(raw);
        const keys = Object.keys(data).map(Number);
        return keys.filter(k => k >= rangeStart && k <= rangeEnd).length;
      } catch {
        return 0;
      }
    };

    const getOverallCount = (prefix: string) => {
      try {
        const raw = localStorage.getItem(`${prefix}-completed`);
        if (!raw) return 0;
        const data = JSON.parse(raw);
        return Object.keys(data).length;
      } catch {
        return 0;
      }
    };

    // Javascript splits (IDs 701 to 773)
    // Core JS & Mechanics: 701 to 746 (46 questions)
    // Advanced & Async: 747 to 773 (27 questions)
    const jsOverall = getOverallCount('frontend-javascript');
    const jsCore = getCompletedCountInRange('frontend-javascript', 701, 746);
    const jsAdvanced = getCompletedCountInRange('frontend-javascript', 747, 773);

    // React splits (IDs 801 to 850)
    // Core React: 801 to 830 (30 questions)
    // Ecosystem & Next.js: 831 to 850 (20 questions)
    const reactOverall = getOverallCount('frontend-react');
    const reactCore = getCompletedCountInRange('frontend-react', 801, 830);
    const reactNextjs = getCompletedCountInRange('frontend-react', 831, 850);

    // Next.js splits (IDs 851 to 900)
    // Routing: 851 to 875 (25 questions)
    // Rendering: 876 to 900 (25 questions)
    const nextjsOverall = getOverallCount('frontend-nextjs');
    const nextjsRouting = getCompletedCountInRange('frontend-nextjs', 851, 875);
    const nextjsRendering = getCompletedCountInRange('frontend-nextjs', 876, 900);

    // MicroFrontends splits (IDs 901 to 950)
    // Orchestration: 901 to 925 (25 questions)
    // Isolation: 926 to 950 (25 questions)
    const mfeOverall = getOverallCount('frontend-mfe');
    const mfeOrchestration = getCompletedCountInRange('frontend-mfe', 901, 925);
    const mfeIsolation = getCompletedCountInRange('frontend-mfe', 926, 950);

    // Machine Coding splits (IDs 951 to 1000)
    // Beginner: 951 to 960 (10 questions)
    // Advanced: 961 to 1000 (40 questions)
    const mcOverall = getOverallCount('frontend-machine-coding');
    const mcBeginner = getCompletedCountInRange('frontend-machine-coding', 951, 960);
    const mcAdvanced = getCompletedCountInRange('frontend-machine-coding', 961, 1000);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProgressData({
      javascript: {
        overall: Math.round((jsOverall / 73) * 100),
        core: Math.round((jsCore / 46) * 100),
        advanced: Math.round((jsAdvanced / 27) * 100),
      },
      react: {
        overall: Math.round((reactOverall / 50) * 100),
        core: Math.round((reactCore / 30) * 100),
        nextjs: Math.round((reactNextjs / 20) * 100),
      },
      nextjs: {
        overall: Math.round((nextjsOverall / 50) * 100),
        routing: Math.round((nextjsRouting / 25) * 100),
        rendering: Math.round((nextjsRendering / 25) * 100),
      },
      mfe: {
        overall: Math.round((mfeOverall / 50) * 100),
        orchestration: Math.round((mfeOrchestration / 25) * 100),
        isolation: Math.round((mfeIsolation / 25) * 100),
      },
      machineCoding: {
        overall: Math.round((mcOverall / 50) * 100),
        beginner: Math.round((mcBeginner / 10) * 100),
        advanced: Math.round((mcAdvanced / 40) * 100),
      }
    });
  }, []);

  const dynamicPillars = React.useMemo(() => {
    return [
      {
        ...pillars[0],
        progress: progressData.javascript.overall,
        domains: [
          { ...pillars[0].domains[0], progress: progressData.javascript.core },
          { ...pillars[0].domains[1], progress: progressData.javascript.advanced },
        ]
      },
      {
        ...pillars[1],
        progress: progressData.react.overall,
        domains: [
          { ...pillars[1].domains[0], progress: progressData.react.core },
          { ...pillars[1].domains[1], progress: progressData.react.nextjs },
        ]
      },
      {
        ...pillars[2],
        progress: progressData.nextjs.overall,
        domains: [
          { ...pillars[2].domains[0], progress: progressData.nextjs.routing },
          { ...pillars[2].domains[1], progress: progressData.nextjs.rendering },
        ]
      },
      {
        ...pillars[3],
        progress: progressData.mfe.overall,
        domains: [
          { ...pillars[3].domains[0], progress: progressData.mfe.orchestration },
          { ...pillars[3].domains[1], progress: progressData.mfe.isolation },
        ]
      },
      {
        ...pillars[4],
        progress: progressData.machineCoding.overall,
        domains: [
          { ...pillars[4].domains[0], progress: progressData.machineCoding.beginner },
          { ...pillars[4].domains[1], progress: progressData.machineCoding.advanced },
        ]
      }
    ];
  }, [progressData]);

  return (
    <div className="flex flex-col h-full ">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Roadmaps
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Frontend Development</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Build responsive, interactive, and modular user interfaces with React, Next.js, MicroFrontends, and Machine Coding practice.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {dynamicPillars.map((pillar) => (
            <RoadmapCard
              key={pillar.name}
              pillar={pillar}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
