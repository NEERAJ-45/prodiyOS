import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import type { ICustomQA } from '@/lib/models/CustomQA';
import '@/lib/models/CustomQA';
import type { ICustomQAProgress } from '@/lib/models/CustomQAProgress';
import '@/lib/models/CustomQAProgress';
import { auth } from '@/auth';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, data: null, progress: {} });
    }

    const CustomQA = conn.model<ICustomQA>('CustomQA');
    const CustomQAProgress = conn.model<ICustomQAProgress>('CustomQAProgress');

    let qaDoc = await CustomQA.findOne({ userEmail }).lean();
    const progressDoc = await CustomQAProgress.findOne({ userEmail }).lean();

    // Auto-migration helper for legacy documents
    if (qaDoc && !qaDoc.books && (qaDoc as any).sections) {
      const legacyDoc = qaDoc as any;
      const migratedBook = {
        slug: 'imported-qa',
        title: legacyDoc.title || 'Imported Q&A',
        totalQuestions: legacyDoc.totalQuestions || 0,
        sections: legacyDoc.sections
      };
      
      // Save migrated document in DB
      await CustomQA.updateOne(
        { userEmail },
        { 
          $set: { 
            activeBookSlug: 'imported-qa',
            books: [migratedBook]
          },
          $unset: { sections: "", title: "", totalQuestions: "" }
        }
      );
      
      qaDoc = await CustomQA.findOne({ userEmail }).lean();
    }

    return NextResponse.json({
      dbConnected: true,
      data: qaDoc || null,
      progress: progressDoc?.progress || {}
    });
  } catch (error: any) {
    console.error('[API/custom-qa] Connection/Migration error:', error.message);
    return NextResponse.json({ dbConnected: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userEmail = session.user.email;
    const customUri = request.headers.get('x-mongodb-url') || undefined;

    const conn = await connectToDatabase(customUri);
    if (!conn) {
      return NextResponse.json({ dbConnected: false, error: 'Database connection failed' }, { status: 500 });
    }

    const body = await request.json();
    const { action } = body;

    const CustomQA = conn.model<ICustomQA>('CustomQA');
    const CustomQAProgress = conn.model<ICustomQAProgress>('CustomQAProgress');

    if (action === 'save_data') {
      const { data } = body;
      if (!data || !data.title || !Array.isArray(data.sections)) {
        return NextResponse.json({ error: 'Missing or invalid data payload' }, { status: 400 });
      }

      const slug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const newBook = {
        slug,
        title: data.title,
        totalQuestions: data.totalQuestions,
        sections: data.sections
      };

      let doc = await CustomQA.findOne({ userEmail });

      if (!doc) {
        doc = new CustomQA({
          userEmail,
          activeBookSlug: slug,
          books: [newBook],
          updatedAt: new Date().toISOString()
        });
      } else {
        // If legacy fields exist, clear them
        if ((doc as any).sections) {
          doc.set('sections', undefined);
          doc.set('title', undefined);
          doc.set('totalQuestions', undefined);
        }

        const bookIdx = doc.books.findIndex((b: any) => b.slug === slug);
        if (bookIdx !== -1) {
          doc.books[bookIdx] = newBook;
        } else {
          doc.books.push(newBook);
        }
        doc.activeBookSlug = slug;
        doc.updatedAt = new Date().toISOString();
      }

      await doc.save();
      logActivity(userEmail, `Added/updated subject "${data.title}" in Custom study bank`);
      return NextResponse.json({ success: true, data: doc });

    } else if (action === 'select_book') {
      const { slug } = body;
      if (!slug) {
        return NextResponse.json({ error: 'Missing book slug' }, { status: 400 });
      }

      const updated = await CustomQA.findOneAndUpdate(
        { userEmail },
        {
          activeBookSlug: slug,
          updatedAt: new Date().toISOString()
        },
        { new: true }
      );
      return NextResponse.json({ success: true, data: updated });

    } else if (action === 'delete_book') {
      const { slug } = body;
      if (!slug) {
        return NextResponse.json({ error: 'Missing book slug' }, { status: 400 });
      }

      const doc = await CustomQA.findOne({ userEmail });
      if (!doc) {
        return NextResponse.json({ error: 'Data store not found' }, { status: 404 });
      }

      doc.books = doc.books.filter((b: any) => b.slug !== slug);
      if (doc.activeBookSlug === slug) {
        doc.activeBookSlug = doc.books.length > 0 ? doc.books[0].slug : '';
      }
      doc.updatedAt = new Date().toISOString();
      await doc.save();

      logActivity(userEmail, `Deleted subject with slug "${slug}" from Custom study bank`);
      return NextResponse.json({ success: true, data: doc });

    } else if (action === 'save_progress') {
      const { progress } = body;
      if (!progress || typeof progress !== 'object') {
        return NextResponse.json({ error: 'Missing or invalid progress payload' }, { status: 400 });
      }

      const updated = await CustomQAProgress.findOneAndUpdate(
        { userEmail },
        {
          progress,
          updatedAt: new Date().toISOString()
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({ success: true, data: updated });

    } else if (action === 'clear') {
      await CustomQA.deleteOne({ userEmail });
      logActivity(userEmail, `Cleared all subjects from Custom study bank`);
      return NextResponse.json({ success: true, cleared: true });

    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[API/custom-qa] Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
