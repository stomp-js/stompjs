export const randomText = (): string => {
  return '' + Math.random();
};

// Generate k Kilo Bytes of binary data
export const generateBinaryData = (k: number): Uint8Array => {
  const chunk: number[] = [];
  for (let i = 0; i < 4 * k; i++) {
    for (let j = 0; j < 256; j++) {
      chunk.push(j);
    }
  }
  return new Uint8Array(chunk);
};

// Generate k Kilo Bytes of text data
export const generateTextData = (k: number): string => {
  const chunk = // 256 Bytes
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed uta' +
    ' ornare arcu. Aenean vehicula, magna in viverra pulvinar, enimr ' +
    'arcu maximus erat, ac malesuada elit libero sit amet dui. Donecl' +
    ' dignissim felis at neque viverra porttitor. Maecenas maximus po';

  const data: string[] = [];
  for (let i = 0; i < 4 * k; i++) {
    data.push(chunk);
  }
  return data.join('');
};
