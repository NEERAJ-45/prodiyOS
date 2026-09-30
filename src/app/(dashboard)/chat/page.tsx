'use client';

import { useState, useEffect } from 'react';
import { ChatThread } from '@/components/chat/ChatThread';
import { useProfile } from '@/components/providers/ProfileProvider';
import { Lock } from 'lucide-react';

const CHAT_CODE = 'TillTheEternity';
const STORAGE_KEY = 'chat-access-code';

export default function ChatPage() {
  const { userName } = useProfile();
  const [username] = useState(userName || 'Anonymous');
  const [input, setInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === CHAT_CODE) setUnlocked(true);
  }, []);

  const unlock = () => {
    if (input.trim() === CHAT_CODE) {
      localStorage.setItem(STORAGE_KEY, CHAT_CODE);
      setUnlocked(true);
    } else {
      setError(true);
      setInput('');
    }
  };

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-muted-foreground/50" />
        </div>
        <h2 className="text-[15px] font-semibold mb-1">Enter Chat Code</h2>
        <p className="text-[13px] text-muted-foreground/50 mb-4">Ask the admin for the code.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); unlock(); }}
          className="flex gap-2 w-full max-w-xs"
        >
          <input
            autoFocus
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            placeholder="Code..."
            className="flex-1 h-11 rounded-full px-4 text-[15px] bg-muted/40 border border-border/50 placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          <button
            type="submit"
            className="h-11 px-5 rounded-full bg-primary text-primary-foreground text-[14px] font-medium hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Join
          </button>
        </form>
        {error && <p className="text-[13px] text-destructive mt-2">Wrong code.</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0">
      <ChatThread username={username} />
    </div>
  );
}
