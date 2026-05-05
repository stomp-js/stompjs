import { Parser } from '../../src/index.js';

export const parseFrame = (chunk: string | ArrayBuffer): any => {
  let frame: any;

  const parser = new Parser(
    (f: any) => {
      frame = f;
    },
    () => {},
  );
  parser.parseChunk(chunk as string);

  return frame;
};
