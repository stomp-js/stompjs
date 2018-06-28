$(document).ready(function () {
  TEST = {
    destination: "/topic/chat.general",
    login: "guest",
    password: "guest",
    url: "ws://localhost:15674/ws",
    badUrl: "ws://localhost:61625",
    timeout: 2000,
    debug: function (str) {
      $("#debug").append(str + "\n");
    }
  };

  // fill server requirements:
  $("#test_url").text(TEST.url);
  $("#test_destination").text(TEST.destination);
  $("#test_login").text(TEST.login);
  $("#test_password").text(TEST.password);

});

var Stomp = StompJs.Stomp;

badStompClient = function () {
  return Stomp.client(TEST.badUrl);
};

stompClient = function () {
  return Stomp.client(TEST.url);
};
