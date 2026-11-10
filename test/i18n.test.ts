import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../lib/i18n/index.ts';
import { AR } from '../lib/i18n/ar/index.ts';

test('English is the default and unknown text falls back to English', () => {
  assert.equal(translate('en', 'Today'), 'Today');
  assert.equal(translate('ar', 'Today'), 'اليوم');
  assert.equal(translate('ar', 'A sentence nobody translated'), 'A sentence nobody translated');
  assert.equal(translate('ar', 'Account menu for {username}', { username: 'sara' }), 'قائمة حساب sara');
});

test('every Arabic entry keeps the {placeholders} of its English key', () => {
  for (const [en, ar] of Object.entries(AR)) {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    assert.equal(ph(ar), ph(en), `placeholders differ for: ${en}`);
    assert.ok(ar.trim().length > 0, `empty Arabic for: ${en}`);
  }
});

test('lists of known words are translated as a whole', () => {
  assert.equal(translate('ar', 'Breakfast and Lunch'), translate('ar', 'Breakfast') + ' و' + translate('ar', 'Lunch'));
});
