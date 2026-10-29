// inactivityTimeouts.test.ts — таймауты автоблокировки из профиля установки (ui в ответе /api/features, пакет F2a).
import './browserWindow';
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { inactivityTimeouts } from '../../src/components/hooks/useInactivityLock';

const MINUTE = 60 * 1000;

describe('таймауты автоблокировки', () => {
  test('профиль не прислал таймауты — как раньше: 10 минут, предупреждение за минуту', () => {
    assert.deepEqual(inactivityTimeouts(null, null), { inactivityMs: 10 * MINUTE, warningMs: MINUTE });
  });

  test('таймауты из профиля установки', () => {
    assert.deepEqual(inactivityTimeouts(30, 2), { inactivityMs: 30 * MINUTE, warningMs: 2 * MINUTE });
  });

  test('предупреждение не дольше половины срока блокировки', () => {
    assert.deepEqual(inactivityTimeouts(2, 5), { inactivityMs: 2 * MINUTE, warningMs: MINUTE });
  });

  test('срок предупреждения 0 — блокировка без предупреждения', () => {
    assert.deepEqual(inactivityTimeouts(5, 0), { inactivityMs: 5 * MINUTE, warningMs: 0 });
  });
});
