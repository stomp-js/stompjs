export interface SpyCall {
  args: any[];
}

export interface SpyCalls {
  count(): number;
  first(): SpyCall;
  mostRecent(): SpyCall;
  all(): SpyCall[];
  allArgs(): any[][];
  reset(): void;
}

export interface SpyAnd {
  callFake(fn: (...args: any[]) => any): Spy;
  callThrough(): Spy;
  returnValue(value: any): Spy;
}

export interface Spy {
  (...args: any[]): any;
  calls: SpyCalls;
  and: SpyAnd;
}

function makeSpy(name?: string): { spy: Spy; setImpl: (fn: ((...args: any[]) => any) | undefined) => void } {
  const callsArray: any[][] = [];
  let _impl: ((...args: any[]) => any) | undefined;

  const spy = function (this: any, ...args: any[]) {
    callsArray.push(args);
    if (_impl) {
      return _impl.apply(this, args);
    }
  } as any as Spy;

  spy.calls = {
    count: () => callsArray.length,
    first: () => ({ args: callsArray[0] }),
    mostRecent: () => ({ args: callsArray[callsArray.length - 1] }),
    all: () => callsArray.map(args => ({ args })),
    allArgs: () => callsArray,
    reset: () => { callsArray.length = 0; },
  };

  const setImpl = (fn: ((...args: any[]) => any) | undefined) => { _impl = fn; };

  spy.and = {
    callFake: (fn: (...args: any[]) => any) => { setImpl(fn); return spy; },
    callThrough: () => spy,
    returnValue: (value: any) => { setImpl(() => value); return spy; },
  };

  return { spy, setImpl };
}

export function createSpy(name?: string): Spy {
  return makeSpy(name).spy;
}

export function spyOn(obj: any, method: string): Spy {
  const original = obj[method];
  const { spy, setImpl } = makeSpy(method);

  spy.and.callThrough = () => {
    setImpl(original ? (...args: any[]) => original.apply(obj, args) : undefined);
    return spy;
  };

  obj[method] = spy;
  return spy;
}
