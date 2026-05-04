import * as StompJs from '../../esm6/index.js';

export const parseFrame = (chunk: string | ArrayBuffer): any => {
  let frame: any;

  const parser = new StompJs.Parser(
    (f: any) => {
      frame = f;
    },
    () => {}
  );
  parser.parseChunk(chunk as string);

  return frame;
};
