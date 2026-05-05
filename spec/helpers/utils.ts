import { test } from '@playwright/test';

export const wait = (timeToDelay: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, timeToDelay));

export const getLength = (data: string | ArrayBuffer): number => {
  return typeof data === 'string' ? data.length : data.byteLength;
};

export const shouldSkipTests = (): boolean => {
  return typeof process !== 'undefined' && process.env['CONN_MODE'] === 'tcp';
};

export const describeSkipIf = (
  condition: boolean,
  description: string,
  specDefinitions: () => void,
): void => {
  if (condition) {
    test.describe.skip(description, specDefinitions);
  } else {
    test.describe(description, specDefinitions);
  }
};

export const itSkipIf = (
  condition: boolean,
  expectation: string,
  assertion: () => any,
  timeout?: number,
): void => {
  if (condition) {
    test.skip(expectation, assertion as any);
  } else {
    if (timeout !== undefined) {
      test(expectation, { timeout }, assertion as any);
    } else {
      test(expectation, assertion as any);
    }
  }
};
