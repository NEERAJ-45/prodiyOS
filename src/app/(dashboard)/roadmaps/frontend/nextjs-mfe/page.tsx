'use client';

import * as React from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import dynamic from 'next/dynamic';

const QuestionsTable = dynamic(() => import('@/components/roadmaps/QuestionsTable'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="text-sm text-zinc-500">Loading Next.js & MicroFrontends topics...</p>
    </div>
  ),
});

interface QuestionItem {
  id: number;
  title: string;
  difficulty: string;
  link: string;
}

const nextjsMfeQuestions: QuestionItem[] = [
  { id: 851, title: 'Next.js Foundations: Pages Router architecture vs App Router nested folder structures', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/next-js-app-routing-system/' },
  { id: 852, title: 'React Server Components (RSC) vs Client Components (RCC) runtime and serialization boundaries', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/react-server-components/' },
  { id: 853, title: 'Data Fetching in Server Components: fetch() cache levels and request memoization mechanics', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/data-fetching-in-nextjs/' },
  { id: 854, title: 'Server-Side Rendering (SSR) vs Static Site Generation (SSG) in App Router pages', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/difference-between-ssr-and-ssg-in-next-js/' },
  { id: 855, title: 'Incremental Static Regeneration (ISR): Revalidation intervals, on-demand revalidation', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/incremental-static-regeneration-isr-in-next-js/' },
  { id: 856, title: 'Static vs Dynamic Rendering decisions, route configurations (force-dynamic, force-static)', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/next-js-dynamic-routing/' },
  { id: 857, title: 'Dynamic Routes: Route Parameters, Catch-all routes, and generateStaticParams() compilation', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/next-js-dynamic-routing/' },
  { id: 858, title: 'Nested Routing: Roles of layouts (layout.js), pages (page.js), and templates (template.js)', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/next-js-app-routing-system/' },
  { id: 859, title: 'Route Handlers: Creating API Routes with NextRequest and NextResponse inside App Router', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/route-handlers-in-next-js/' },
  { id: 860, title: 'Parallel Routes: Defining slots using @folder syntax and rendering conditional layouts', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/next-js-parallel-routes/' },
  { id: 861, title: 'Intercepting Routes: Displaying overlays and modals with contextual URLs ((.)folder pattern)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/next-js-intercepting-routes/' },
  { id: 862, title: 'Suspense-based Streaming: Implementing loading.js and skeleton placeholders for page transitions', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/reactjs-suspense/' },
  { id: 863, title: 'Error Boundaries: Localized error recovery using error.js and root fallback with global-error.js', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/next-js-error-handling/' },
  { id: 864, title: 'Server Actions: Declaring inline and module-level backend execution from forms directly', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/server-actions-in-next-js/' },
  { id: 865, title: 'Form Mutations: Validating schema (Zod), form state handling, and useOptimistic UI updates', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/next-js-form-validation/' },
  { id: 866, title: 'Routing Middleware: URL redirects, rewrites, custom headers injection, and session parsing', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/next-js-middleware/' },
  { id: 867, title: 'Internationalization (i18n): Localized routing paths, dynamic dictionary loads in App Router', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/internationalization-i18n-in-next-js/' },
  { id: 868, title: 'Performance: next/image optimizations, sizing, placeholder blur, and modern format generation', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/next-js-image-component/' },
  { id: 869, title: 'Performance: next/font configuration, Google fonts caching, and local layout shift containment', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/next-js-font-optimization/' },
  { id: 870, title: 'Performance: next/script loading strategies (beforeInteractive, afterInteractive, lazyOnload)', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/nextjs-script-component/' },
  { id: 871, title: 'CSS-in-JS inside Server Components: Configuring TailwindCSS, CSS Modules, and emotion configurations', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/css-modules-in-nextjs/' },
  { id: 872, title: 'Advanced Caching: Request Memoization, Data Cache, Full Route Cache, and Router Cache lifetimes', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/nextjs-caching/' },
  { id: 873, title: 'Custom Configurations: redirects, rewrites, compiler options, and webpack modifications in next.config.js', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/next-js-configuration/' },
  { id: 874, title: 'Next.js Security: CORS policy setups, CSP headers, CSRF tokens, and API authentication patterns', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/next-js-security/' },
  { id: 875, title: 'Self-Hosting Next.js: Deploying to standalone Node servers vs Docker containers vs Vercel', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/deploying-next-js-application/' },
  { id: 876, title: 'Introduction to MicroFrontends (MFE): Monolithic frontend decomposition into self-contained apps', difficulty: 'EASY', link: 'https://www.geeksforgeeks.org/micro-frontend-architecture/' },
  { id: 877, title: 'MFE Integration: Build-time (monorepos, npm packages) vs Run-time (dynamic scripts, frames)', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/micro-frontend-integration-techniques/' },
  { id: 878, title: 'Webpack Module Federation: Concepts of Container, Host, Remote, and Shared modules', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/webpack-module-federation/' },
  { id: 879, title: 'Configuring ModuleFederationPlugin in Next.js (nextjs-mf utility plugin integration)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/webpack-module-federation-with-nextjs/' },
  { id: 880, title: 'Library Sharing: Coordinating shared singleton versions of React, ReactDOM, and styling libraries', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/sharing-libraries-in-micro-frontends/' },
  { id: 881, title: 'Single-SPA Orchestrator: Registering application hooks, layouts, dynamic script loading', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/single-spa-micro-frontend-framework/' },
  { id: 882, title: 'Single-SPA Lifecycles: Implementing bootstrap, mount, unmount, and parcel compositions', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/single-spa-lifecycles/' },
  { id: 883, title: 'Server-Side Composition: Composing HTML fragments on the edge (Tailwind, Podium setups)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/server-side-composition-micro-frontends/' },
  { id: 884, title: 'iFrame Microfrontends: Sandbox configurations, postMessage API, window event communications', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/iframe-integration-in-micro-frontends/' },
  { id: 885, title: 'Web Components (Custom Elements, Shadow DOM) for framework-agnostic modular UI packaging', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/web-components-in-micro-frontends/' },
  { id: 886, title: 'Communication: Window Bus patterns, Custom DOM Events, and BroadcastChannel APIs', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/communication-between-micro-frontends/' },
  { id: 887, title: 'State Sharing: Shared store sync using Zustand, Redux toolkit slices, or RxJS event emitters', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/state-management-in-micro-frontends/' },
  { id: 888, title: 'CSS Isolation: CSS Modules, Tailwind prefixes, and namespace scopes in remote containers', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/css-isolation-in-micro-frontends/' },
  { id: 889, title: 'Shared Design System: Packaging component libraries, tokens, and asset paths across MFEs', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/design-systems-in-micro-frontends/' },
  { id: 890, title: 'Independent Deployment: CI/CD configuration for remotes without host builds or re-deployments', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/deploying-micro-frontends/' },
  { id: 891, title: 'Asset Caching: Managing hashes, CDN paths, and runtime mapping file (import maps / manifest)', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/micro-frontend-asset-management/' },
  { id: 892, title: 'Fault Tolerance: Error recovery, layout fallbacks, and connection drops in remote loads', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/fault-tolerance-in-micro-frontends/' },
  { id: 893, title: 'Routing: Resolving back/forward operations, route sync between host and sub-applications', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/routing-in-micro-frontends/' },
  { id: 894, title: 'Version Coexistence: Multi-version loading and executing legacy code side-by-side with modern remotes', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/version-coexistence-in-micro-frontends/' },
  { id: 895, title: 'Edge Routing: Edge redirects, dynamic route maps, and CDN-level composition', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/edge-routing-in-micro-frontends/' },
  { id: 896, title: 'MFE Security: CORS rules, JWT propagating, sandboxing, and trusted source verification', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/micro-frontend-security-best-practices/' },
  { id: 897, title: 'Performance: Code-splitting remotes, lazy mounting, and minimizing Cumulative Layout Shift (CLS)', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/micro-frontend-performance-optimization/' },
  { id: 898, title: 'Federated SSR: Enabling server-side rendering support with Webpack Module Federation', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/federated-ssr-module-federation/' },
  { id: 899, title: 'Testing MFEs: Dynamic integration tests using Playwright / Cypress environments', difficulty: 'HARD', link: 'https://www.geeksforgeeks.org/testing-micro-frontends/' },
  { id: 900, title: 'Monorepo Setup: Managing multi-app architectures with Turborepo, pnpm workspaces, and Nx', difficulty: 'MEDIUM', link: 'https://www.geeksforgeeks.org/turborepo-monorepo-setup/' }
];

export default function NextjsMfeQuestionsPage() {
  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 min-h-screen">
      <Navbar />
      <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link
            href="/roadmaps/frontend"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Frontend Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Next.js & MicroFrontends</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Deep dive into server components caching, middleware operations, and Webpack Module Federation / Single-SPA micro-frontend integration patterns.
            </p>
          </div>
        </div>

        <QuestionsTable
          questions={nextjsMfeQuestions}
          storagePrefix="frontend-nextjs-mfe"
          searchPlaceholder="Search Next.js & MFE topics..."
        />
      </div>
    </div>
  );
}
