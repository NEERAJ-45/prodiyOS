import { describe, expect, it } from 'vitest';
import { Binary } from 'mongodb';
import { toBuffer } from '../gridfs';

describe('toBuffer', () => {
  it('passes Buffers through', () => {
    const value = Buffer.from('pdf bytes');
    expect(toBuffer(value)).toBe(value);
  });

  it('converts BSON Binary from a lean query', () => {
    const value = new Binary(Buffer.from('%PDF-1.7 fake'));
    expect(toBuffer(value).toString()).toBe('%PDF-1.7 fake');
  });

  it('converts a Uint8Array view', () => {
    const value = new Uint8Array([1, 2, 3, 4, 5]).subarray(1, 4);
    expect([...toBuffer(value)]).toEqual([2, 3, 4]);
  });

  it('returns an empty buffer for missing data', () => {
    expect(toBuffer(null).length).toBe(0);
    expect(toBuffer(undefined).length).toBe(0);
  });
});
