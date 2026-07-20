import { readFile } from 'fs/promises';

export async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    parser.destroy();
    return result.text || '';
  } catch {
    return '';
  }
}

export async function extractTextFromPdfPath(filePath: string): Promise<string> {
  try {
    const buffer = await readFile(filePath);
    return extractTextFromPdfBuffer(buffer);
  } catch {
    return '';
  }
}
