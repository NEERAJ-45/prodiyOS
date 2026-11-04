// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    seen.form = null;
  });

  it('enables Add Doc once a title and file are chosen', () => {
    render(<Harness />);

    expect(screen.getByRole('button', { name: 'Add Doc' })).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText('Document title'), {
      target: { value: 'My Doc' },
    });

    const file = new File(['pdf-bytes'], 'notes.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByRole('button', { name: 'Add Doc' })).toBeEnabled();
    expect(seen.form?.file).toBe(file);
    expect(seen.form?.fileName).toBe('notes.pdf');
  });

  it('replaces the previous file when a new file is chosen', () => {
    render(<Harness />);

    fireEvent.change(screen.getByPlaceholderText('Document title'), {
      target: { value: 'My Doc' },
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, {
      target: { files: [new File(['a'], 'a.pdf', { type: 'application/pdf' })] },
    });

    const next = new File(['b'], 'b.docx', { type: 'application/octet-stream' });
    fireEvent.change(fileInput, { target: { files: [next] } });

    expect(seen.form?.file).toBe(next);
    expect(seen.form?.fileName).toBe('b.docx');
    expect(seen.form?.fileType).toBe('docx');
  });
});
