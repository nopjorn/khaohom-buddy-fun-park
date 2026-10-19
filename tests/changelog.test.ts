import { describe, expect, it } from 'vitest';
import pkg from '../package.json';
import { CHANGELOG, compareVersions, unseenChanges } from '../src/data/changelog';

describe('บันทึกการเปลี่ยนแปลง', () => {
  it('รายการบนสุดตรงกับเลขรุ่นใน package.json จึงลืมเขียน changelog ไม่ได้', () => {
    expect(CHANGELOG[0].version).toBe(pkg.version);
  });

  it('เรียงจากใหม่ไปเก่าและเลขรุ่นไม่ซ้ำ', () => {
    for (let i = 1; i < CHANGELOG.length; i++) {
      expect(compareVersions(CHANGELOG[i - 1].version, CHANGELOG[i].version)).toBeGreaterThan(0);
    }
  });

  it('ทุกรุ่นมีวันที่และมีรายการอย่างน้อยหนึ่งข้อ', () => {
    for (const entry of CHANGELOG) {
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.changes.length).toBeGreaterThan(0);
    }
  });
});

describe('การเทียบเลขรุ่น', () => {
  it('เทียบทีละส่วนเป็นตัวเลข ไม่ใช่ตัวอักษร', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.2.0', '1.2.1')).toBeLessThan(0);
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
  });
});

describe('รุ่นที่ยังไม่ได้บอกผู้เล่น', () => {
  const log = [
    { version: '1.3.0', date: '2026-10-19', changes: ['c'] },
    { version: '1.2.0', date: '2026-10-03', changes: ['b'] },
    { version: '1.1.0', date: '2026-10-03', changes: ['a'] },
  ];
  const versions = (seen: string, fresh: boolean) =>
    unseenChanges(log, '1.3.0', seen, fresh).map((e) => e.version);

  it('อัปเดตข้ามหลายรุ่นได้ทุกรุ่นที่ยังไม่เห็น', () => {
    expect(versions('1.1.0', false)).toEqual(['1.3.0', '1.2.0']);
  });

  it('เห็นรุ่นปัจจุบันแล้วไม่ต้องบอกซ้ำ', () => {
    expect(versions('1.3.0', false)).toEqual([]);
  });

  it('ติดตั้งใหม่ไม่ต้องบอกว่าอัปเดต', () => {
    expect(versions('', true)).toEqual([]);
  });

  it('ข้อมูลจากรุ่นที่ยังไม่จำรุ่นที่เห็น บอกเฉพาะรุ่นปัจจุบัน', () => {
    expect(versions('', false)).toEqual(['1.3.0']);
  });
});
