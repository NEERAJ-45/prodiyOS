// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const captured: { opts?: { onClientUploadComplete?: (res: unknown[]) => void } } = {};

vi.mock('@/lib/uploadthing', () => ({
  useUploadThing: (_endpoint: string, opts: unknown) => {
    captured.opts = opts as typeof captured.opts;
    return { startUpload: vi.fn(), isUploading: false };
  },
}));

import { DocFormDialog, type DocFormState } from '../DocFormDialog';

const seen: { form: DocFormState | null } = { form: null };

function Harness() {
  const [form, setForm] = React.useState<DocFormState>({
    title: '',
    category: '',
    status: 'TO_READ',
  });
  return (
    <DocFormDialog
      open
      onOpenChange={() => {}}
      mode="add"
      form={form}
      onFormChange={(next) => {
        seen.form = next;
        setForm(next);
      }}
      onSave={() => {}}
      isPending={false}
      categorySuggestions={[]}
    />
  );
}

describe('DocFormDialog add flow', () => {
  beforeEach(() => {
    captured.opts = undefined;
    seen.form = null;
  });

  it('enables Add Doc after a successful upload', async () => {
    render(<Harness />);

    const addButton = screen.getByRole('button', { name: 'Add Doc' });
    expect(addButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Document title'), {
      target: { value: 'My Doc' },
    });

    const file = new File(['pdf-bytes'], 'notes.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    await act(async () => {
      captured.opts?.onClientUploadComplete?.([
        { url: 'https://utcdn.dev/notes.pdf', name: 'notes.pdf' },
      ]);
    });

    expect(screen.getByRole('button', { name: 'Add Doc' })).toBeEnabled();
    expect(seen.form?.fileUrl).toBe('https://utcdn.dev/notes.pdf');
  });

  it('clears the previous file when a new file is chosen', async () => {
    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('Document title'), {
      target: { value: 'My Doc' },
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['a'], 'a.pdf', { type: 'application/pdf' })] },
    });
    await act(async () => {
      captured.opts?.onClientUploadComplete?.([
        { url: 'https://utcdn.dev/a.pdf', name: 'a.pdf' },
      ]);
    });

    fireEvent.change(fileInput, {
      target: { files: [new File(['b'], 'b.docx', { type: 'application/octet-stream' })] },
    });

    // new file still uploading: footer + choose-file buttons must both be disabled
    const uploadingButtons = screen.getAllByRole('button', { name: /Uploading/i });
    expect(uploadingButtons.length).toBeGreaterThan(0);
    uploadingButtons.forEach((b) => expect(b).toBeDisabled());

    await act(async () => {
      captured.opts?.onClientUploadComplete?.([
        { url: 'https://utcdn.dev/b.docx', name: 'b.docx' },
      ]);
    });

    expect(screen.getByRole('button', { name: 'Add Doc' })).toBeEnabled();
    // fileUrl must be the NEW upload, not the stale previous one
    expect(seen.form?.fileUrl).toBe('https://utcdn.dev/b.docx');
    expect(seen.form?.fileName).toBe('b.docx');
  });
});
