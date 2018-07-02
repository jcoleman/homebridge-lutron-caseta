import {TestHelper} from './test_helper.js';
import FakeServer  from './fake_server.js';
import {FakeServerConnectionStates} from './fake_server.js';
import net from 'net';
import CasetaBridgeConnection from "../src/caseta_bridge_connection.js";
import {CasetaBridgeConnectionStates} from "../src/caseta_bridge_connection.js";

describe("CasetaBridgeConnection", () => {
  describe("#constructor", () => {
    let connectMock;
    beforeEach(() => {
      connectMock = jest.fn((port, host) => {
        return {on: jest.fn()};
      });
      jest.spyOn(net, "connect").mockImplementation(connectMock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("opens a socket to the provided host and port", () => {
      const fakeHost = "random.string", fakePort = "12312";
      new CasetaBridgeConnection(jest.fn(), {host: fakeHost, port: fakePort});

      expect(connectMock.mock.calls[0]).toEqual([fakePort, fakeHost]);
    });

    it("initializes the state to AWAITING_LOGIN", () => {
      const bridgeConnection = new CasetaBridgeConnection(jest.fn());
      expect(bridgeConnection.state).toEqual(CasetaBridgeConnectionStates.AWAITING_LOGIN);
    });
  });

  describe("with fake server", () => {
    let messages, server, serverConnection, serverSocket, bridgeConnection, bridgeSocket;
    beforeEach(() => {
      const debug = false;
      messages = [];

      server = new FakeServer({messages: messages, debug: debug});
      server.listeningPromise.then((address) => {
        bridgeConnection = new CasetaBridgeConnection(
          jest.fn(),
          {
            host: address.address,
            port: address.port,
            debug: debug,
          }
        );
        bridgeSocket = bridgeConnection.socket;

        bridgeSocket.on("data", (data) => {
          if (debug) {
            console.log("Bridge socket received data", data.toString());
          }
          messages.push({
            receiver: "bridge_connection",
            data: data.toString()
          });
        });
      });

      return server.connectionReceivedPromise.then((connection) => {
        serverConnection = connection;
        serverSocket = serverConnection.socket;
      });
    });

    afterEach(() => {
      bridgeSocket.destroy();
      const closePromise = new Promise((resolve) => {
        server.netServer.once("close", resolve);
      });
      server.netServer.close();
      return closePromise;
    });

    describe("#receiveData", () => {
      describe("state = AWAITING_LOGIN", () => {
        it("logs in", () => {
          expect.assertions(8 * 2 + 1 + 1);

          const expectationsChain = Promise.resolve().then(
            TestHelper.chainedWaitForMessageOnSocket(bridgeSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(1);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "bridge_connection",
                data: "login: \r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(serverSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(2);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "server_connection",
                data: "lutron\r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(bridgeSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(3);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "bridge_connection",
                data: "password: \r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(serverSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(4);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "server_connection",
                data: "integration\r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(bridgeSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(5);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "bridge_connection",
                data: "login: \r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(serverSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(6);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "server_connection",
                data: "lutron\r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(bridgeSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(7);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "bridge_connection",
                data: "password: \r\n"
              });
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(serverSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(messages.length).toEqual(8);
              expect(messages[messages.length - 1]).toEqual({
                receiver: "server_connection",
                data: "integration\r\n"
              });

              expect(serverConnection.state).toEqual(FakeServerConnectionStates.LOGGED_IN);
            })
          ).then(
            TestHelper.chainedWaitForMessageOnSocket(bridgeSocket)
          ).then(
            TestHelper.chainedWrapWithPromise(() => {
              expect(bridgeConnection.state).toEqual(CasetaBridgeConnectionStates.LOGGED_IN);
            })
          );

          return expectationsChain;
        });
      });
    });
  });
});
