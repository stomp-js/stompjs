wait = (timeToDelay) =>
  new Promise(resolve => setTimeout(resolve, timeToDelay));

// Find length
getLength = data => {
  return typeof data === 'string' ? data.length : data.byteLength;
};

// Helper to check if tests should be skipped
shouldSkipTests = function() {
  // Check if running on Firefox
  const isFirefox = typeof navigator !== 'undefined' &&
    /Firefox/i.test(navigator.userAgent);

  // Check if CONN_MODE is 'tcp'
  const isTcpMode = typeof process !== 'undefined' &&
    process.env.CONN_MODE === 'tcp';

  return isFirefox || isTcpMode;
};

// Conditional test functions
describeSkipIf = function(condition, description, specDefinitions) {
  if (condition) {
    xdescribe(description, specDefinitions);
  } else {
    describe(description, specDefinitions);
  }
};

itSkipIf = function(condition, expectation, assertion, timeout) {
  if (condition) {
    xit(expectation, assertion, timeout);
  } else {
    it(expectation, assertion, timeout);
  }
};
