import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db';
import { ChatMessage } from '@/lib/models/ChatMessage';
import { toggleReaction } from '@/lib/chat-reactions';

// Toggle the caller's reaction: same emoji removes it, different emoji replaces it.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user, emoji } = body as { user?: unknown; emoji?: unknown };

    if (typeof user !== 'string' || !user || typeof emoji !== 'string' || !emoji) {
      return NextResponse.json({ error: 'user and emoji required' }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    await connectToDatabase();
    const msg = await ChatMessage.findById(id).lean();
    if (!msg) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const reactions = toggleReaction(msg.reactions ?? [], user, emoji);
    await ChatMessage.findByIdAndUpdate(id, { reactions });

    return NextResponse.json({ ok: true, reactions });
  } catch (error) {
    console.error('PATCH /api/chat/messages/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a single message (anyone may delete any message).
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: 'Invalid message id' }, { status: 400 });
    }

    await connectToDatabase();
    const res = await ChatMessage.findByIdAndDelete(id);
    if (!res) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('DELETE /api/chat/messages/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
