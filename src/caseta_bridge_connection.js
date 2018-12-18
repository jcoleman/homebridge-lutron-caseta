import net from "net";
import EventEmitter from "events";

const States = {
  AWAITING_LOGIN: 1,
  LOGGED_IN: 2,
};

class CasetaBridgeConnection extends EventEmitter {
  static connectionDefaults() {
    return {
      host: null,
      port: 23,
      username: "lutron",
      password: "integration",
      debug: false,
    };
  }

  constructor(log, connectionOpts) {
    super();

    this.log = log;

    this.connectionOpts = Object.assign({}, CasetaBridgeConnection.connectionDefaults(), connectionOpts);

    this.state = States.AWAITING_LOGIN;

    this.socket = net.connect(this.connectionOpts.port, this.connectionOpts.host);
    this.socket.on('connect', () => {

    });
    this.socket.on('data', (data) => {
      this.receiveData(data);
    });
    this.socket.on('error', (error) => {
      throw error;
    });
    this.socket.on('end', () => {
      // TODO
    });
  }

  receiveData(data) {
    // TODO: do we need to worry about partial strings?
    const lines = data.toString().split("\r\n").filter(l => l != "");

    for (let line of lines) {
      if (this.connectionOpts.debug) {
        console.log("Bridge connection processing line", line);
      }
      switch (this.state) {
        case States.AWAITING_LOGIN:
          if (/^login:\s*/.test(line)) {
            this.socket.write(`${this.connectionOpts.username}\r\n`);
          } else if (/^password:\s*/.test(line)) {
            this.socket.write(`${this.connectionOpts.password}\r\n`);
          } else if (/^GNET>\s*/.test(line)) {
            this.state = States.LOGGED_IN;
            this.emit("loggedIn");
          } else {

          }
          break;
        case States.LOGGED_IN:
          const args = line.split(",");
          if (args[0][0] === "~") {
            this.emit("monitorMessageReceived", args[1], args.slice(2));
          }
          break;
      }
    }
  }
}

export const CasetaBridgeConnectionStates = States;
export default CasetaBridgeConnection;
