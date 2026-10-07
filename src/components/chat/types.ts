import type { ChatReaction } from '@/lib/chat-reactions';

export type { ChatReaction };

export interface ReplyTo {
  id: string;
  from: string;
  text: string;
}

export interface ChatMsg {
  id: string;
  from: string;
  text: string;
  createdAt: string;
  reactions: ChatReaction[];
  replyTo: ReplyTo | null;
}
