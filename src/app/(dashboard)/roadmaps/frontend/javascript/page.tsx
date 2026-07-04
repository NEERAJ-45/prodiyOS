'use client';

import { ArrowLeft, ShieldAlert, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

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

export default function JavascriptRoadmapPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        <div className="mb-6">
          <Link
            href="/roadmaps/frontend"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Frontend Dashboard
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
              JavaScript Fundamentals
            </h1>
            <p className="text-sm text-zinc-500 mt-1 max-w-2xl">
              Complete reference combining core language fundamentals, browser APIs, security, engine internals, and code drills.
            </p>
          </div>
        </div>

        {/* Priority Notes Alert Box */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 md:p-5 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="flex gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-amber-300">
                Priority Notes for Backend/Payments Roles (Razorpay, Juspay, CRED)
              </h3>
              <p className="text-xs text-amber-400/80 leading-relaxed max-w-3xl">
                These are high-weight areas. Prioritize and gain deep confidence in these concepts over general browser APIs:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-zinc-300 mt-1">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                  <span>Event loop internals + async/await mechanics</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                  <span>Closures (lexical environments, memory lifecycle)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                  <span>Prototypes & prototypal inheritance</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                  <span>Async error handling (unhandled rejections)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-400/60 shrink-0" />
                  <span>Security: XSS, prototype pollution, CORS</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <QuestionsTable
          questions={javascriptQuestions}
          storagePrefix="frontend-javascript"
          searchPlaceholder="Search JavaScript concepts, functions, security vulnerabilities..."
        />
      </div>
    </div>
  );
}
