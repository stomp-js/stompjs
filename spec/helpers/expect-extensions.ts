import { expect as baseExpect } from '@playwright/test';
import type { SinonSpy, SinonStub } from 'sinon';

type SpyLike = SinonSpy | SinonStub;

export const expect = baseExpect.extend({
  toHaveBeenCalled(received: SpyLike) {
    const pass = received.called;
    return {
      pass,
      message: () => pass
        ? 'Expected spy not to have been called'
        : 'Expected spy to have been called',
    };
  },

  toHaveBeenCalledTimes(received: SpyLike, n: number) {
    const count = received.callCount;
    const pass = count === n;
    return {
      pass,
      message: () => `Expected spy to have been called ${n} time(s) but was called ${count} time(s)`,
    };
  },

  toHaveBeenCalledWith(received: SpyLike, ...expected: any[]) {
    const allCalls = received.getCalls();
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
