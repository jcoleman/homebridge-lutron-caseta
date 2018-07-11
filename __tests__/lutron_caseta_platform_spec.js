import {TestHelper} from './test_helper.js';
import FakeServer  from './fake_server.js';
import {FakeServerConnectionStates} from './fake_server.js';
import net from 'net';
import EventEmitter from 'events';
import CasetaBridgeConnection from "../src/caseta_bridge_connection.js";
import {CasetaBridgeConnectionStates} from "../src/caseta_bridge_connection.js";
import LutronCasetaPlatform from "../src/lutron_caseta_platform.js";
import LutronAccessory from "../src/lutron_accessory.js";
import {API} from "homebridge";
import {PlatformAccessory} from "homebridge/lib/platformAccessory.js";
import * as UUID from "hap-nodejs/lib/util/uuid.js"

describe("LutronCasetaPlatform", () => {
  let homebridge, platform;
  const baseConfig = {
    bridgeConnection: {},
    accessories: [
      {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "test remote",
      },
    ],
  };

  beforeEach(() => {
    homebridge = new API();
  });

  describe("without fake server", () => {
    let connectMock;

    beforeEach(() => {
      connectMock = jest.fn((port, host) => {
        return {on: jest.fn()};
      });
      jest.spyOn(net, "connect").mockImplementation(connectMock);

      platform = new LutronCasetaPlatform(() => { }, baseConfig, homebridge);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("tracks an accessory from Homebridge's cache", () => {
      const cachedPlatformAccessory = new PlatformAccessory("Display Name", UUID.generate("bogus"));
      cachedPlatformAccessory.context.config = {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "test remote",
      };

      expect(platform.accessoriesByIntegrationID).toEqual({});

      platform.configureAccessory(cachedPlatformAccessory);

      expect(Object.keys(platform.accessoriesByIntegrationID)).toEqual(["2"]);
      const trackedAccessory = platform.accessoriesByIntegrationID["2"];
      expect(trackedAccessory).toBeInstanceOf(LutronAccessory);
    });

    it("loads accessories from config after launch finishes", () => {
      expect.assertions(4);

      expect(platform.accessoriesByIntegrationID).toEqual({});

      const accessoriesRegisteredPromise = new Promise((resolve) => {
        homebridge.once("registerPlatformAccessories", (accessories) => {
          expect(accessories).toEqual([
            platform.accessoriesByIntegrationID["2"].platformAccessory,
          ]);
          resolve();
        });
      });

      homebridge.emit("didFinishLaunching");

      expect(Object.keys(platform.accessoriesByIntegrationID)).toEqual(["2"]);
      expect(platform.accessoriesByIntegrationID["2"]).toBeInstanceOf(LutronAccessory);
    });

    describe("type = PICO-REMOTE", () => {
      // TODO: handle multiple remote types.
      let accessory;
      beforeEach(() => {
        const accessoriesRegisteredPromise = new Promise((resolve) => {
          homebridge.once("registerPlatformAccessories", (accessories) => {
            accessory = platform.accessoriesByIntegrationID["2"];
            resolve();
          });
        });

        homebridge.emit("didFinishLaunching");

        return accessoriesRegisteredPromise;
      });

      it("builds an accessory with stateless programmable switch services", () => {
        const switchServices = accessory.platformAccessory.services.filter(
          s => s instanceof homebridge.hap.Service.StatelessProgrammableSwitch
        );

        expect(switchServices.length).toEqual(2);
      });
    });

  });

  describe("with fake server", () => {
    let server, serverSocket;
    beforeEach(() => {
      const debug = false;

      server = new FakeServer({debug: debug});

      server.listeningPromise.then((address) => {
        const platformConfig = Object.assign(
          {},
          baseConfig,
          {
            bridgeConnection: {
              host: address.address,
              port: address.port,
              debug: debug,
            },
          }
        );
        platform = new LutronCasetaPlatform(console.log, platformConfig, homebridge);
      });

     const serverSocketSetup = server.connectionReceivedPromise.then((connection) => {
        serverSocket = connection.socket;
      });

      const bridgeSocketSetup = server.listeningPromise.then(() => {
        return new Promise((resolve) => {
          platform.bridgeConnection.socket.once("connect", () => {
            resolve();
          });
        });
      });
      return Promise.all([serverSocketSetup, bridgeSocketSetup]);
    });

    afterEach(() => {
      const closePromise = new Promise((resolve) => {
        server.netServer.once("close", resolve);
      });
      platform.bridgeConnection.socket.destroy();
      server.netServer.close();
      return closePromise;
    });

    it("routes button press events to the right accessory", () => {
      expect.assertions(1);

      homebridge.emit("didFinishLaunching");

      const accessory = platform.accessoriesByIntegrationID["2"];
      const service = accessory.platformAccessory.getServiceByUUIDAndSubType(homebridge.hap.Service.StatelessProgrammableSwitch, "4");
      const characteristic = service.getCharacteristic(homebridge.hap.Characteristic.ProgrammableSwitchEvent);

      characteristic.setValue = jest.fn();

      // TODO: find better way of waiting for login
      let previousState = platform.bridgeConnection.state;
      platform.bridgeConnection.socket.on("data", () => {
        if (previousState !== platform.bridgeConnection.state && platform.bridgeConnection.state === CasetaBridgeConnectionStates.LOGGED_IN) {
          previousState = platform.bridgeConnection.state;
          serverSocket.write("~DEVICE,2,4,3");
        }
      });

      // TODO: implement test and then _dispatchMonitorMessage
      return new Promise((resolve) => {
        platform.bridgeConnection.on("monitorMessageReceived", () => {
          setTimeout(() => { // TODO: maybe not necessary.
            expect(characteristic.setValue.mock.calls).toEqual([[1]]);
            resolve();
          }, 0);
        });
      });
    });
  });
});
