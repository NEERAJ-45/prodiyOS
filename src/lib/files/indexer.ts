import DocContent from '@/lib/models/DocContent';
import { extractDocText } from '@/lib/doc-extractor';
import { isTextMime } from './mime';

const MAX_INDEX_BYTES = 20 * 1024 * 1024;
const MAX_INDEX_CHARS = 50000;

export async function indexContent(params: {
  docId: string;
  userEmail: string;
  title: string;
  category: string;
  fileType: string;
  mimeType: string;
  buffer: Buffer | null;
}): Promise<void> {
  const { docId, userEmail, title, category, fileType, mimeType, buffer } = params;
  if (!buffer || buffer.length === 0 || buffer.length > MAX_INDEX_BYTES) return;

  let text = '';
  if (fileType === 'pdf' || fileType === 'docx') {
    text = await extractDocText(buffer, fileType);
  } else if (isTextMime(mimeType, title)) {
    text = buffer.toString('utf8');
  }

  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 20) return;

  await DocContent.findOneAndUpdate(
    { docId },
    {
      docId,
      userEmail,
      title,
      category,
      content: clean.slice(0, MAX_INDEX_CHARS),
      contentLength: clean.length,
      indexedAt: new Date(),
    },
    { upsert: true }
  );
}

export async function removeIndexedContent(docIds: string[]): Promise<void> {
  if (docIds.length > 0) await DocContent.deleteMany({ docId: { $in: docIds } });
}
