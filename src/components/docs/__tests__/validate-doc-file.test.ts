import { describe, expect, it } from 'vitest';
import { validateDocFile } from '../DocFormDialog';

const MB = 1024 * 1024;

function file(name: string, size: number, type = '') {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

function errorOf(f: File) {
  const r = validateDocFile(f);
  return 'error' in r ? r.error : undefined;
}

describe('validateDocFile', () => {
  it('accepts a small md file', () => {
    expect(validateDocFile(file('notes.md', 100))).toEqual({ type: 'md' });
  });

  it('accepts a small pdf with correct mime', () => {
    expect(validateDocFile(file('paper.pdf', 100, 'application/pdf'))).toEqual({ type: 'pdf' });
  });

  it('accepts a docx with long mime', () => {
    expect(
      validateDocFile(
        file('r.docx', 100, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      )
    ).toEqual({ type: 'docx' });
  });

  it('rejects unsupported extensions', () => {
    expect(errorOf(file('run.log', 100))).toMatch(/Unsupported file type/);
    expect(errorOf(file('photo.png', 100))).toMatch(/Unsupported file type/);
  });

  it('rejects files over 32MB with size in message', () => {
    const msg = errorOf(file('big.pdf', 40 * MB, 'application/pdf'));
    expect(msg).toMatch(/too large/);
    expect(msg).toMatch(/40/);
    expect(msg).toMatch(/32/);
  });

  it('accepts files exactly at the 32MB limit', () => {
    expect(validateDocFile(file('limit.pdf', 32 * MB, 'application/pdf'))).toEqual({ type: 'pdf' });
  });
});
