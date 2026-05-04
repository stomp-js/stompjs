import { expect as baseExpect } from '@playwright/test';
import type { Spy } from './spy.js';

export const expect = baseExpect.extend({
  toHaveBeenCalled(received: Spy) {
    const count = received.calls.count();
    const pass = count > 0;
    return {
      pass,
      message: () => pass
        ? 'Expected spy not to have been called'
        : 'Expected spy to have been called',
    };
  },

  toHaveBeenCalledTimes(received: Spy, n: number) {
    const count = received.calls.count();
    const pass = count === n;
    return {
      pass,
      message: () => `Expected spy to have been called ${n} time(s) but was called ${count} time(s)`,
    };
  },

  toHaveBeenCalledWith(received: Spy, ...expected: any[]) {
    const allCalls = received.calls.all();
    const pass = allCalls.some(call => {
      try {
        baseExpect(call.args).toEqual(expected);
        return true;
      } catch {
        return false;
      }
    });
    return {
      pass,
      message: () => pass
        ? `Expected spy not to have been called with ${JSON.stringify(expected)}`
        : `Expected spy to have been called with ${JSON.stringify(expected)}. Actual calls: ${JSON.stringify(allCalls.map(c => c.args))}`,
    };
  },
});
