import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export async function POST() {
  try {
    const conn = await connectToDatabase();
    if (!conn) {
      return NextResponse.json({ error: 'No database configured' }, { status: 503 });
    }

    const db = conn.db;
    if (!db) {
      return NextResponse.json({ error: 'No database instance' }, { status: 503 });
    }

    const collections = await db.listCollections().toArray();
    const names = collections.map((c) => c.name);

    return NextResponse.json({
      ok: true,
      collections: names,
      db: db.databaseName,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
