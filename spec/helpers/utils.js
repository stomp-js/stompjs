wait = (timeToDelay) =>
  new Promise(resolve => setTimeout(resolve, timeToDelay));

// Find length
getLength = data => {
  return typeof data === 'string' ? data.length : data.byteLength;
};
