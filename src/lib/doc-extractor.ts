export type DocFileType = 'pdf' | 'docx' | 'md';

export function detectDocFileType(fileName: string): DocFileType | null {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'md' || ext === 'markdown') return 'md';
  return null;
}

export async function fetchDocFile(fileUrl: string): Promise<Buffer> {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error(`Failed to fetch doc file: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function extractDocText(buffer: Buffer, fileType: DocFileType): Promise<string> {
  try {
    if (fileType === 'pdf') {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      parser.destroy();
      return result.text || '';
    }
    if (fileType === 'docx') {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    }
    return buffer.toString('utf-8');
  } catch (e) {
    console.error('[doc-extractor] extractDocText failed:', (e as Error).message);
    return '';
  }
}

export async function convertDocxToHtml(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ buffer });
  return result.value || '';
}
