import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

function extractLatexError(log: string): string {
  const lines = log.split('\n');
  const errors: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('! ')) {
      const line = lines[i].replace(/^! /, '');
      const context = lines[i + 1]?.trim();
      const pointer = lines[i + 2]?.trim();
      errors.push(context ? `${line}\n  ${context}${pointer ? `\n  ${pointer}` : ''}` : line);
      i += 2;
    }
  }
  return errors.length > 0
    ? errors.slice(0, 5).join('\n\n')
    : log.slice(0, 2000);
}

async function compileLocally(source: string): Promise<Buffer> {
  const tmpDir = await mkdtemp(join(tmpdir(), 'latex-'));
  const texPath = join(tmpDir, 'resume.tex');
  await writeFile(texPath, source, 'utf-8');

  const pdf = await new Promise<Buffer>((resolve, reject) => {
    const proc = spawn('pdflatex', [
      '-interaction=nonstopmode',
      '-halt-on-error',
      `-output-directory=${tmpDir}`,
      texPath,
    ]);

    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error('Compilation timed out after 30s'));
    }, 30000);

    const stderr: string[] = [];
    proc.stderr.on('data', (d: Buffer) => stderr.push(d.toString()));

    proc.on('close', async (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        try {
          const logPath = join(tmpDir, 'resume.log');
          const log = await readFile(logPath, 'utf-8').catch(() => stderr.join('\n'));
          reject(new Error(extractLatexError(log)));
        } catch {
          reject(new Error(stderr.join('\n') || 'LaTeX compilation failed'));
        }
        return;
      }
      try {
        const pdfBuffer = await readFile(join(tmpDir, 'resume.pdf'));
        resolve(pdfBuffer);
      } catch {
        reject(new Error('PDF output not found after compilation'));
      }
    });

    proc.on('error', (err: NodeJS.ErrnoException) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  return pdf;
}

async function compileViaCloud(source: string): Promise<Buffer> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch('https://latex.ytotech.com/builds/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compiler: 'pdflatex',
        resources: [{ main: true, content: source }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      if (res.status === 413) {
        throw new Error('Document too large for the cloud compiler (max ~5MB)');
      }
      if (res.status === 429) {
        throw new Error('Cloud compiler rate limited — try again in a moment');
      }
      throw new Error(text ? extractLatexError(text) : `Cloud compiler error (${res.status})`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error('Cloud compiler returned an empty PDF');
    }
    return buffer;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Cloud compilation timed out after 30s');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.source || typeof body.source !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid LaTeX source' }, { status: 400 });
    }
    if (body.source.length > 500000) {
      return NextResponse.json({ error: 'LaTeX source too large (max 500KB)' }, { status: 400 });
    }

    let pdf: Buffer;
    try {
      pdf = await compileLocally(body.source);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        pdf = await compileViaCloud(body.source);
      } else {
        return NextResponse.json({ error: err.message || 'Local compilation failed' }, { status: 422 });
      }
    }

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="resume.pdf"',
        'Content-Length': String(pdf.length),
      },
    });
  } catch (error: any) {
    const message = error?.message || 'Compilation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
