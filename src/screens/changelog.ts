import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { CHANGELOG } from '../data/changelog';
import { topBar } from './ui';

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { dateStyle: 'medium' });
}

export function changelogScreen(app: App): ScreenView {
  const entries = CHANGELOG.map((entry) =>
    h(
      'div',
      { class: 'field' },
      h(
        'div',
        { class: 'field-label' },
        `v${entry.version}`,
        h('span', { class: 'changelog-date' }, formatDate(entry.date)),
      ),
      h('ul', { class: 'changelog-list' }, ...entry.changes.map((c) => h('li', null, c))),
    ),
  );

  const el = h(
    'div',
    { class: 'screen scrollable' },
    topBar('📜 มีอะไรใหม่', () => app.go({ name: 'home' })),
    h('div', { class: 'settings-list' }, ...entries),
  );
  return { el };
}
