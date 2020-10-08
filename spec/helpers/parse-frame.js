parseFrame = function (chunk) {
  let frame;

  // ignore
  parser = new StompJs.Parser(
    f => {
      frame = f;
    },
    () => {}
  );
  parser.parseChunk(chunk);

  return frame;
};
