import { describe, expect, it } from 'vitest';
import { parseScene, serializeScene } from '@/lib/whiteboard-scene';

function collaboratorsOf(scene: string): unknown {
  return (parseScene(scene).appState as Record<string, unknown>).collaborators;
}

const isIterableOrAbsent = (value: unknown) =>
  value === undefined || typeof (value as { forEach?: unknown }).forEach === 'function';

describe('whiteboard scene round-trip', () => {
  it('never yields a non-iterable collaborators after serialization', () => {
    const appState = { viewBackgroundColor: '#1e1e1e', collaborators: new Map() };
    const scene = serializeScene([], appState, {});

    expect(isIterableOrAbsent(collaboratorsOf(scene))).toBe(true);
  });

  it('sanitizes legacy scenes that stored a plain-object collaborators', () => {
    const legacy = JSON.stringify({
      elements: [],
      appState: { viewBackgroundColor: '#1e1e1e', collaborators: {} },
      files: {},
    });

    expect(isIterableOrAbsent(collaboratorsOf(legacy))).toBe(true);
  });

  it('preserves elements through a round-trip', () => {
    const elements = [{ id: 'x', type: 'rectangle' }] as unknown as Parameters<
      typeof serializeScene
    >[0];
    const scene = serializeScene(elements, { viewBackgroundColor: '#1e1e1e' }, {});

    expect(parseScene(scene).elements).toHaveLength(1);
  });

  it('keeps image files in the serialized scene', () => {
    const elements = [
      { id: 'img1', type: 'image', fileId: 'f1', isDeleted: false },
    ] as unknown as Parameters<typeof serializeScene>[0];
    const files = {
      f1: {
        id: 'f1',
        mimeType: 'image/png',
        dataURL: 'data:image/png;base64,AAAA',
        created: 1,
        lastRetrieved: 1,
      },
    } as unknown as Parameters<typeof serializeScene>[2];

    const scene = serializeScene(elements, { viewBackgroundColor: '#1e1e1e' }, files);

    expect((JSON.parse(scene).files ?? {}).f1).toBeTruthy();
    expect(parseScene(scene).files).toHaveProperty('f1');
  });
});