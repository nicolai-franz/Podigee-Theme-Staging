import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const template = readFileSync(new URL('../docs/staging/pro-podcast-controls.html', import.meta.url), 'utf8');
const source = template.slice(template.indexOf('      function providerLabel(link) {'), template.indexOf('      function syncProviderLabels() {'));
const providerLabel = vm.runInNewContext(`(function () { ${source}; return providerLabel; })()`);

function node(textContent, tagName = 'SPAN', generated = false) {
  return { nodeType: 1, tagName, textContent, classList: { contains: name => generated && name === 'preview-provider-label' } };
}

function link(href, nativeLabel, generatedLabel) {
  const childNodes = [node('icon metadata', 'svg'), node(nativeLabel), node(generatedLabel, 'SPAN', true)];
  return {
    href, childNodes,
    get textContent() { return childNodes.map(child => child.textContent).join(''); },
    getAttribute() { return null; }
  };
}

test('all six configured providers keep a stable label across repeated observer passes', () => {
  for (const [url, native, expected] of [
    ['https://podcasts.apple.com/podcast/id1', 'Apple Podcasts', 'Apple'],
    ['https://open.spotify.com/show/1', 'Spotify', 'Spotify'],
    ['https://music.amazon.de/podcasts/1', 'Alexa', 'Alexa'],
    ['https://www.listennotes.com/c/1/', 'Listen Notes', 'Listen Notes'],
    ['https://www.deezer.com/show/1', 'Deezer', 'Deezer'],
    ['https://podcastaddict.com/podcast/1', 'Podcast Addict', 'Podcast Addict']
  ]) {
    const element = link(url, native, expected);
    for (let pass = 0; pass < 100; pass++) {
      const label = providerLabel(element);
      assert.equal(label, expected, `${native}, observer pass ${pass}`);
      element.childNodes[2].textContent = label;
    }
  }
});

test('new providers retain their native label without copying SVG metadata or generated text', () => {
  assert.equal(providerLabel(link('https://example.org/show', 'New provider', 'old generated label')), 'New provider');
});
