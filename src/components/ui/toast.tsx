'use client';

import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast';

type ToastProps = {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

const style = document.createElement('style');
style.textContent = `
  .toast-enter {
    animation: toastSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .toast-exit {
    animation: toastSlideOut 0.25s ease-in forwards;
  }
  @keyframes toastSlideIn {
    from { transform: translateX(24px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes toastSlideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(24px); opacity: 0; }
  }
`;
if (typeof document !== 'undefined') document.head.appendChild(style);

let counter = 0;

function toast({ title, description, variant = 'default' }: ToastProps) {
  const id = `toast-${++counter}`;

  hotToast.custom(
    (t) => (
      <div
        className={`${t.visible ? 'toast-enter' : 'toast-exit'} flex items-start gap-2 rounded-lg border px-3 py-2.5 shadow-lg text-xs ${
          variant === 'destructive'
            ? 'border-red-500/25 bg-red-950/90 text-red-200'
            : 'border-zinc-700/50 bg-zinc-900/95 text-zinc-100'
        }`}
        style={{ minWidth: 260, maxWidth: 320 }}
      >
        {variant === 'destructive' && (
          <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        )}
        <div className="flex-1 min-w-0">
          {title && <div className="font-medium leading-snug">{title}</div>}
          {description && <div className="mt-0.5 leading-snug text-zinc-400">{description}</div>}
        </div>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          className="-mr-1 -mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    { id, duration: 4000 }
  );

  return {
    id,
    dismiss: () => hotToast.dismiss(id),
  };
}

function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      containerStyle={{ top: 12, right: 12 }}
      toastOptions={{ duration: 4000 }}
    />
  );
}

export { toast, Toaster };
export type { ToastProps };
