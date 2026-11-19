import assert from 'node:assert/strict';
import { test } from 'node:test';

import { goalProgress } from '@/domain/goal';

test('goal progress works for losing and gaining, and stays within 0–100', () => {
  assert.equal(goalProgress(90, 85, 80), 50);
  assert.equal(goalProgress(60, 63, 66), 50);
  assert.equal(goalProgress(90, 92, 80), 0);
  assert.equal(goalProgress(90, 78, 80), 100);
  assert.equal(goalProgress(80, 80, 80), 100);
  assert.equal(goalProgress(80, 80, 0), 0);
});
