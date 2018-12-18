// @ts-check
const net = require("net");
const { EventEmitter } = require("events");

const ConnectionState = {
  AWAITING_LOGIN: 1,
  LOGGED_IN: 2
};

const ConnectionEvent = {
  LoggedIn: "loggedIn",
  MonitorMessageReceived: "monitorMessageReceived"
};

class CasetaBridgeConnection extends EventEmitter {
  constructor(log, options) {
    super();
    this.log = log;
    this.options = {
      ...{
        host: null,
        port: 23,
        username: "lutron",
        password: "integration",
        debug: false
      },
      ...options
    };
    this.state = ConnectionState.AWAITING_LOGIN;
    this.socket = net.connect(
      this.options.port,
      this.options.host
    );
    this.socket.on("data", data => {
      this.receiveData(data);
    });
    this.socket.on("error", error => {
      log(`CasetaBridgeConnection error: ${error.message}`);
    });
  }

  receiveData(data) {
    const lines = data
      .toString()
      .split("\r\n")
      .filter(l => l != "");
    for (let line of lines) {
      if (this.options.debug) {
        console.log("Bridge connection processing line", line);
      }
      switch (this.state) {
        case ConnectionState.AWAITING_LOGIN:
          if (/^login:\s*/.test(line)) {
            this.socket.write(`${this.options.username}\r\n`);
          } else if (/^password:\s*/.test(line)) {
            this.socket.write(`${this.options.password}\r\n`);
          } else if (/^GNET>\s*/.test(line)) {
            this.state = ConnectionState.LOGGED_IN;
            this.emit(ConnectionEvent.LoggedIn);
          }
          break;
        case ConnectionState.LOGGED_IN:
          const args = line.split(",");
          if (args[0][0] === "~") {
            this.emit(
              ConnectionEvent.MonitorMessageReceived,
              args[1],
              args.slice(2)
            );
          }
          break;
      }
    }
  }
}

module.exports = {
  ConnectionState,
  ConnectionEvent,
  CasetaBridgeConnection
};
