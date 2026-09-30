import { describe, it, expect, beforeEach } from 'vitest';
import { highlightText, clearHighlights } from '@/lib/reader-highlight';

let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

describe('highlightText()', () => {
  it('wraps matches in mark elements and returns them', () => {
    root.innerHTML = '<p>alpha beta alpha</p>';
    const marks = highlightText(root, 'alpha');
    expect(marks.length).toBe(2);
    expect(root.querySelectorAll('mark[data-reader-mark]').length).toBe(2);
    expect(root.textContent).toBe('alpha beta alpha');
  });

  it('is case-insensitive', () => {
    root.innerHTML = '<p>Hello WORLD</p>';
    expect(highlightText(root, 'world').length).toBe(1);
  });

  it('matches across separate text nodes', () => {
    root.innerHTML = '<p>one <strong>two</strong> one</p>';
    expect(highlightText(root, 'one').length).toBe(2);
  });

  it('returns empty array for empty query', () => {
    root.innerHTML = '<p>text</p>';
    expect(highlightText(root, '   ')).toHaveLength(0);
    expect(root.querySelectorAll('mark').length).toBe(0);
  });
});

describe('clearHighlights()', () => {
  it('restores the original text exactly', () => {
    root.innerHTML = '<p>one two one</p>';
    highlightText(root, 'one');
    clearHighlights(root);
    expect(root.querySelectorAll('mark').length).toBe(0);
    expect(root.textContent).toBe('one two one');
    // Node is normalized back to a single text node per element
    expect((root.querySelector('p')!.firstChild as Text).nodeValue).toBe('one two one');
  });
});
