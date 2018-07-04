QUnit.module("Stomp Frame");

QUnit.test("escape header value", function (assert) {
  var out = StompJs.Frame.frEscape("anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\");
  assert.equal(out, "anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\anything\\\\a\\nb\\nc\\rd\\re\\cf\\c\\\\");
});

QUnit.test("escapes and then unescapes header value to give original string", function (assert) {
  var orig = "anything\\a\nb\nc\rd\re:f:\\anything\\a\nb\nc\rd\re:f:\\";
  var out = StompJs.Frame.frUnEscape(StompJs.Frame.frEscape(orig));
  assert.equal(out, orig);
});

QUnit.test("marshall a CONNECT frame", function (assert) {
  var out = StompJs.Frame.marshall("CONNECT", {login: 'jmesnil', passcode: 'wombats'});
  assert.equal(out, "CONNECT\nlogin:jmesnil\npasscode:wombats\n\n\0");
});

QUnit.test("marshall a SEND frame", function (assert) {
  var out = StompJs.Frame.marshall("SEND", {destination: '/queue/test'}, "hello, world!");
  assert.equal(out, "SEND\ndestination:/queue/test\ncontent-length:13\n\nhello, world!\0");
});

QUnit.test("marshall a SEND frame without content-length", function (assert) {
  var out = StompJs.Frame.marshall("SEND", {destination: '/queue/test', 'content-length': false}, "hello, world!");
  assert.equal(out, "SEND\ndestination:/queue/test\n\nhello, world!\0");
});

QUnit.test("unmarshall a CONNECTED frame", function (assert) {
  var data = "CONNECTED\nsession-id: 1234\n\n\0";
  var frame = StompJs.Frame.unmarshall(data).frames[0];
  assert.equal(frame.command, "CONNECTED");
  assert.deepEqual(frame.headers, {'session-id': "1234"});
  assert.equal(frame.body, '');
});

QUnit.test("unmarshall a RECEIVE frame", function (assert) {
  var data = "RECEIVE\nfoo: abc\nbar: 1234\n\nhello, world!\0";
  var frame = StompJs.Frame.unmarshall(data).frames[0];
  assert.equal(frame.command, "RECEIVE");
  assert.deepEqual(frame.headers, {foo: 'abc', bar: "1234"});
  assert.equal(frame.body, "hello, world!");
});

QUnit.test("unmarshall should not include the null byte in the body", function (assert) {
  var body1 = 'Just the text please.',
    body2 = 'And the newline\n',
    msg = "MESSAGE\ndestination: /queue/test\nmessage-id: 123\n\n";

  assert.equal(StompJs.Frame.unmarshall(msg + body1 + '\0').frames[0].body, body1);
  assert.equal(StompJs.Frame.unmarshall(msg + body2 + '\0').frames[0].body, body2);
});

QUnit.test("unmarshall should support colons (:) in header values", function (assert) {
  var dest = 'foo:bar:baz',
    msg = "MESSAGE\ndestination: " + dest + "\nmessage-id: 456\n\n\0";

  assert.equal(StompJs.Frame.unmarshall(msg).frames[0].headers.destination, dest);
});

QUnit.test("unmarshall should support colons (:) in header values with escaping", function (assert) {
  var dest = 'foo:bar:baz',
    msg = "MESSAGE\ndestination: " + 'foo\\cbar\\cbaz' + "\nmessage-id: 456\n\n\0";

  assert.equal(StompJs.Frame.unmarshall(msg, true).frames[0].headers.destination, dest);
});

QUnit.test("unmarshall should support \\, \\n and \\r in header values with escaping", function (assert) {
  var dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
    msg = "MESSAGE\ndestination: " + 'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' + "\nmessage-id: 456\n\n\0";

  assert.equal(StompJs.Frame.unmarshall(msg, true).frames[0].headers.destination, dest);
});

QUnit.test("marshall should support \\, \\n and \\r in header values with escaping", function (assert) {
  var dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\',
    msg = "MESSAGE\ndestination:" + 'f\\co\\co\\nbar\\rbaz\\\\foo\\nbar\\rbaz\\\\' + "\nmessage-id:456\n\n\0";

  assert.equal(StompJs.Frame.marshall("MESSAGE", {"destination": dest, "message-id": "456"}, "", true), msg);
});

QUnit.test("marshal/unmarshall should support \\, \\n and \\r in header values with escaping", function (assert) {
  var dest = 'f:o:o\nbar\rbaz\\foo\nbar\rbaz\\';
  var command = "MESSAGE";
  var headers = {"destination": dest, "message-id": "456"};
  var body = "";

  var msg = StompJs.Frame.marshall(command, headers, body, true);
  var frame = StompJs.Frame.unmarshall(msg, true).frames[0];

  assert.deepEqual(frame.headers, headers);
});

QUnit.test("only the 1st value of repeated headers is used", function (assert) {
  var msg = "MESSAGE\ndestination: /queue/test\nfoo:World\nfoo:Hello\n\n\0";

  assert.equal(StompJs.Frame.unmarshall(msg).frames[0].headers['foo'], 'World');
});

QUnit.test("Content length of UTF-8 strings", function (assert) {
  assert.equal(0, StompJs.Frame.sizeOfUTF8());
  assert.equal(0, StompJs.Frame.sizeOfUTF8(""));
  assert.equal(1, StompJs.Frame.sizeOfUTF8("a"));
  assert.equal(2, StompJs.Frame.sizeOfUTF8("ф"));
  assert.equal(3, StompJs.Frame.sizeOfUTF8("№"));
  assert.equal(15, StompJs.Frame.sizeOfUTF8("1 a ф № @ ®"));
});