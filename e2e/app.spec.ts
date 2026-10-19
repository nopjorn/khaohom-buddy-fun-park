import { type Page, expect, test } from '@playwright/test';

const SAVE_KEY = 'buddy-park-v1';

/** ข้อผิดพลาดของ JavaScript ในหน้าเว็บทำให้เทสต์ล้ม แม้หน้าตาจะดูปกติ */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

function today(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function withSave(page: Page, save: object): Promise<void> {
  await page.addInitScript(
    ([key, value]) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem(key, value);
        sessionStorage.setItem('seeded', '1');
      }
    },
    [SAVE_KEY, JSON.stringify(save)] as const,
  );
}

/** แตะปุ่มค้างไว้ (ปุ่มของผู้ปกครองต้องกดค้าง 2 วินาที) */
async function hold(page: Page, name: string | RegExp): Promise<void> {
  const box = (await page.getByRole('button', { name }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(2200);
  await page.mouse.up();
}

/** ของในแผงต้องอยู่ในแผงทั้งหมด ไม่ล้นหรือถูกตัด */
async function expectInsidePanels(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const problems: string[] = [];
    for (const panel of document.querySelectorAll<HTMLElement>('.panel-body')) {
      const p = panel.getBoundingClientRect();
      for (const el of panel.querySelectorAll<HTMLElement>('.choice, .mcard, .quiz-text, .vis-item, .coin')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        if (r.left < p.left - 1 || r.right > p.right + 1 || r.top < p.top - 1 || r.bottom > p.bottom + 1) {
          problems.push(`${el.className} "${el.textContent?.slice(0, 20)}"`);
        }
      }
    }
    if (document.documentElement.scrollWidth > window.innerWidth) problems.push('หน้าเลื่อนแนวนอนได้');
    return problems;
  });
  expect(overflow).toEqual([]);
}

/** ตอบข้อที่แสดงอยู่ให้ถูกหนึ่งข้อ โดยแตะตัวเลือกไปเรื่อย ๆ จนกว่าจะถูก */
async function answerOne(page: Page, panel: string): Promise<boolean> {
  const choices = page.locator(`${panel} .choice`);
  if ((await choices.count()) === 0) return false;
  for (let i = 0; i < 6; i++) {
    const enabled = page.locator(`${panel} .choice:not([disabled])`);
    if ((await enabled.count()) === 0) break;
    await enabled.first().click();
    if ((await page.locator(`${panel} .choice.correct`).count()) > 0) return true;
    await page.waitForTimeout(1100);
  }
  return false;
}

async function startGame(page: Page, zone: string, mode: string): Promise<void> {
  await page.getByRole('button', { name: '▶ เล่นเลย' }).click();
  await page.getByRole('button', { name: new RegExp(zone) }).click();
  await page.getByRole('button', { name: new RegExp(mode) }).click();
  await expect(page.locator('.overlay.countdown')).toHaveCount(0, { timeout: 6000 });
}

test('หน้าแรกเปิดได้ มีเลขรุ่น และติดตั้งใหม่ไม่เด้งหน้าต่างอัปเดต @touch', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'สวนสนุกคู่หู' })).toBeVisible();
  await expect(page.locator('.version')).toContainText('v');
  await expect(page.locator('.whats-new')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /ภารกิจ/ })).toBeVisible();
  expect(errors).toEqual([]);
});

const ZONES = ['ตัวเลข', 'ก ไก่', 'ABC', 'สีและขนาด', 'ฝึกสมอง', 'สุ่มรวม'];

for (const seating of ['side', 'facing'] as const) {
  for (const zone of ZONES) {
    const tag = zone === 'สุ่มรวม' ? ' @touch' : '';
    test(`เล่นโหมดช่วยกัน โซน${zone} ท่านั่ง ${seating}: ตอบได้และไม่ล้นแผง${tag}`, async ({ page }) => {
      const errors = watchErrors(page);
      await withSave(page, { settings: { seating }, levels: {}, stickers: [], seenVersion: '9.9.9' });
      await page.goto('/');
      await startGame(page, zone, 'ช่วยกัน');
      for (let round = 0; round < 4; round++) {
        await expectInsidePanels(page);
        if (!(await answerOne(page, '.panel-child'))) break;
        await page.waitForTimeout(1000);
      }
      expect(errors).toEqual([]);
    });
  }
}

// ระดับสูงสุดของลูกมีตัวเลือกมากและภาพใหญ่ที่สุด จึงเสี่ยงล้นแผงมากที่สุด
const TOP_LEVELS = { counting: 4, money: 4, thai: 4, vowels: 4, english: 4, shapes: 4, compare: 4, pattern: 4, memory: 3 };
for (const seating of ['side', 'facing'] as const) {
  for (const zone of ['ตัวเลข', 'ก ไก่', 'สีและขนาด']) {
    test(`ระดับสูงสุดของลูก โซน${zone} ท่านั่ง ${seating} ไม่ล้นแผง`, async ({ page }) => {
      await withSave(page, { settings: { seating }, levels: TOP_LEVELS, stickers: [], seenVersion: '9.9.9' });
      await page.goto('/');
      await startGame(page, zone, 'ช่วยกัน');
      for (let round = 0; round < 5; round++) {
        await expectInsidePanels(page);
        if (!(await answerOne(page, '.panel-child'))) break;
        await page.waitForTimeout(1000);
      }
    });
  }
}

for (const mode of ['คุยกัน', 'แข่งกัน']) {
  test(`เล่นโหมด${mode} โซนสุ่มรวมได้โดยไม่มีข้อผิดพลาด`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/');
    await startGame(page, 'สุ่มรวม', mode);
    for (let round = 0; round < 3; round++) {
      await expectInsidePanels(page);
      const answered = (await answerOne(page, '.panel-child')) || (await answerOne(page, '.panel-parent'));
      if (!answered) break;
      await page.waitForTimeout(1000);
    }
    expect(errors).toEqual([]);
  });
}

test('หน้าของผู้ปกครองและหน้าอื่น ๆ เปิดได้ครบ', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await page.getByRole('button', { name: /สติกเกอร์/ }).click();
  await expect(page.getByText('ชุดสัตว์บก')).toBeVisible();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();

  await page.getByRole('button', { name: /ภารกิจ/ }).click();
  await expect(page.getByText(/เล่นต่อเนื่อง/)).toBeVisible();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();

  await hold(page, /ผู้ปกครอง/);
  await expect(page.getByText('ตั้งค่าสำหรับผู้ปกครอง')).toBeVisible();
  await page.getByRole('button', { name: /ดูผลการเล่น/ }).click();
  await expect(page.getByText('7 วันล่าสุด')).toBeVisible();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  await page.getByRole('button', { name: /สำรองและย้ายข้อมูล/ }).click();
  await expect(page.locator('textarea').first()).toHaveValue(/^KBP1:/);
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  await page.getByRole('button', { name: /มีอะไรใหม่/ }).click();
  await expect(page.getByText(/^v\d+\.\d+\.\d+/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('เพิ่มลูกอีกคนแล้วเลือกคนเล่นจากหน้าแรก', async ({ page }) => {
  await page.goto('/');
  await hold(page, /ผู้ปกครอง/);
  await page.getByPlaceholder('ชื่อลูกอีกคน').fill('พี่ต้น');
  await page.getByRole('button', { name: '➕ เพิ่มลูก' }).click();
  await expect(page.getByText(/พี่ต้น/)).toBeVisible();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();

  await page.getByRole('button', { name: /เปลี่ยนคน/ }).click();
  await page.getByRole('button', { name: /พี่ต้น/ }).click();
  await expect(page.locator('.player-chip')).toContainText('พี่ต้น');
});

test('เล่นครบเวลาที่ตั้งไว้แล้วขึ้นหน้าพัก ผู้ปกครองกดค้างให้เล่นต่อได้', async ({ page }) => {
  await withSave(page, {
    settings: { dailyLimit: 15 },
    levels: {},
    stickers: [],
    seenVersion: '9.9.9',
    days: { [today()]: { ms: 20 * 60_000, games: 1 } },
  });
  await page.goto('/');
  await expect(page.getByText('วันนี้เล่นครบเวลาแล้ว')).toBeVisible();
  await page.getByRole('button', { name: '▶ เล่นเลย' }).click();
  await expect(page.getByText('พักสายตากันนะ')).toBeVisible();
  await hold(page, /ให้เล่นต่อวันนี้/);
  await expect(page.getByText('วันนี้เล่นอะไรดี?')).toBeVisible();
});

test('เครื่องที่ไม่มีเสียงไทย แสดงโจทย์เป็นข้อความบนแผงของลูก', async ({ page }) => {
  await page.addInitScript(() => {
    // จำลองเครื่องที่มีแต่เสียงอังกฤษ
    const synth = window.speechSynthesis;
    synth.getVoices = () => [{ lang: 'en-US', name: 'English' } as SpeechSynthesisVoice];
    synth.speak = () => {};
  });
  await page.goto('/');
  await page.getByRole('button', { name: '▶ เล่นเลย' }).click();
  await page.getByRole('button', { name: /ก ไก่/ }).click();
  await page.getByRole('button', { name: /ช่วยกัน/ }).click();
  await expect(page.getByText(/ไม่มีเสียงภาษาไทย/)).toBeVisible();
  await expect(page.locator('.panel-child .say-caption')).toBeVisible({ timeout: 6000 });
});
