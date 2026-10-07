import mongoose, { Schema, type Document } from 'mongoose';

export interface IChatReaction {
  user: string;
  emoji: string;
}

export interface IChatReplyTo {
  id: string;
  from: string;
  text: string;
}

export interface IChatMessage extends Document {
  from: string;
  text: string;
  reactions: IChatReaction[];
  replyTo?: IChatReplyTo | null;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  from: { type: String, required: true },
  text: { type: String, required: true },
  reactions: {
    type: [{ user: { type: String, required: true }, emoji: { type: String, required: true } }],
    default: [],
  },
  replyTo: {
    type: new Schema<IChatReplyTo>(
      {
        id: { type: String, required: true },
        from: { type: String, required: true },
        text: { type: String, required: true },
      },
      { _id: false }
    ),
    default: null,
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

export const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
