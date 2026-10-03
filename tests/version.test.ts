import { describe, expect, it } from 'vitest';
import { formatVersion } from '../src/core/version';

describe('ข้อความรุ่น', () => {
  it('รันในเครื่องไม่มี commit จึงบอกว่ารันในเครื่อง', () => {
    expect(formatVersion('1.2.3', '2026-10-03T06:05:00.000Z', '')).toBe('v1.2.3 · รันในเครื่อง');
  });

  it('รุ่นที่ deploy แล้วมีเลขรุ่น เวลาที่ build และ commit', () => {
    const label = formatVersion('1.2.3', '2026-10-03T06:05:00.000Z', 'abc1234');
    expect(label.startsWith('v1.2.3 · ')).toBe(true);
    expect(label.endsWith(' · abc1234')).toBe(true);
    // ส่วนกลางคือวันเวลา ซึ่งรูปแบบขึ้นกับเขตเวลาของเครื่อง จึงตรวจแค่ว่าไม่ว่างและอ่านค่าได้
    const middle = label.slice('v1.2.3 · '.length, -' · abc1234'.length);
    expect(middle).not.toBe('');
    expect(middle).not.toContain('Invalid');
  });

  it('เวลาที่ build ต่างกันทำให้ข้อความต่างกัน แม้เลขรุ่นและ commit เท่าเดิม', () => {
    const first = formatVersion('1.2.3', '2026-10-03T06:05:00.000Z', 'abc1234');
    const second = formatVersion('1.2.3', '2026-10-04T09:30:00.000Z', 'abc1234');
    expect(first).not.toBe(second);
  });
});
