import type { App, ScreenView } from '../app';
import { h } from '../core/dom';
import { allProfiles, switchProfile } from '../engine/profiles';
import { regularCount } from '../engine/stickers';
import { STICKERS } from '../data/items';
import { button, topBar } from './ui';

/** ให้ลูกเลือกว่าใครจะเล่น แต่ละคนมีระดับ สติกเกอร์ และสถิติของตัวเอง */
export function profilesScreen(app: App): ScreenView {
  const cards = allProfiles(app.save).map((p) => {
    const card = button(
      p.id === app.save.profileId ? 'card profile-card on' : 'card profile-card',
      [
        h('span', { class: 'card-icon' }, p.childAvatar),
        h('span', { class: 'card-name' }, p.childName),
        h('span', { class: 'card-hint' }, `📒 ${regularCount(p.stickers)}/${STICKERS.length}`),
      ],
      () => {
        app.save = switchProfile(app.save, p.id);
        app.persist();
        app.go({ name: 'home' });
      },
    );
    return card;
  });

  const el = h(
    'div',
    { class: 'screen' },
    topBar('ใครจะเล่น?', () => app.go({ name: 'home' })),
    h('div', { class: 'screen-main' }, h('div', { class: 'cards cards-zones' }, ...cards)),
  );
  return { el };
}
