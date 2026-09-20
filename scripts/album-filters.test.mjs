import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Compile the pure module in memory so the suite also works on Node 22.
const source = await readFile(new URL('../src/lib/album-filters.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2017 } });
const { getAlbumTags, filterAlbums } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const albums = [
  { slug: 'a', artist: ' Dijon ', genre: 'R&B' },
  { slug: 'b', artist: 'Dijon', genre: 'R&B / SOUL' },
  { slug: 'c', artist: 'Tyler, the Creator', genre: 'R&B' },
  { slug: 'd', artist: 'R&B', genre: ' ' },
];

test('tags deduplicate trimmed values, preserve punctuation and sort by frequency stably', () => {
  assert.deepEqual(getAlbumTags(albums).map(({ type, value }) => [type, value]), [
    ['artist', 'Dijon'], ['genre', 'R&B'], ['genre', 'R&B / SOUL'],
    ['artist', 'Tyler, the Creator'], ['artist', 'R&B'],
  ]);
});

test('exact matching distinguishes genre from artist and preserves album order', () => {
  const tags = getAlbumTags(albums);
  assert.deepEqual(filterAlbums(albums, tags.find(t => t.type === 'genre' && t.value === 'R&B')).map(a => a.slug), ['a', 'c']);
  assert.deepEqual(filterAlbums(albums, tags.find(t => t.type === 'artist' && t.value === 'R&B')).map(a => a.slug), ['d']);
  assert.deepEqual(filterAlbums(albums, tags.find(t => t.value === 'Dijon')).map(a => a.slug), ['a', 'b']);
  assert.equal(new Set(tags.map(t => t.id)).size, 5);
});

test('clearing returns all albums, including missing genres; empty input is supported', () => {
  assert.deepEqual(filterAlbums(albums, null), albums);
  assert.deepEqual(getAlbumTags([{ artist: 'Solo' }]).map(t => t.value), ['Solo']);
  assert.deepEqual(getAlbumTags([]), []);
  assert.deepEqual(filterAlbums(albums, { type: 'genre', value: 'Jazz' }), []);
});
