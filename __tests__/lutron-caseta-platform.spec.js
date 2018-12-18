// @ts-check
const net = require("net");
const { API } = require("homebridge");
const { PlatformAccessory } = require("homebridge/lib/platformAccessory");
const UUID = require("hap-nodejs/lib/util/uuid");
const { FakeServer } = require("./fake-server");
const { LutronCasetaPlatform } = require("../src/lutron-caseta-platform");
const { LutronAccessory } = require("../src/lutron-accessory");

describe("LutronCasetaPlatform", () => {
  let homebridge, platform;
  const baseConfig = {
    bridgeConnection: {},
    accessories: [
      {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "test remote"
      }
    ]
  };

  beforeEach(() => {
    homebridge = new API();
  });

  describe("without fake server", () => {
    let connectMock;

    beforeEach(() => {
      connectMock = jest.fn((port, host) => {
        return { on: jest.fn() };
      });
      jest.spyOn(net, "connect").mockImplementation(connectMock);

      platform = new LutronCasetaPlatform(() => {}, baseConfig, homebridge);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("tracks an accessory from Homebridge's cache", () => {
      const cachedPlatformAccessory = new PlatformAccessory(
        "Display Name",
        UUID.generate("bogus")
      );
      cachedPlatformAccessory.context.config = {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "test remote"
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

      const accessoriesRegisteredPromise = new Promise(resolve => {
        homebridge.once("registerPlatformAccessories", accessories => {
          expect(accessories).toEqual([
            platform.accessoriesByIntegrationID["2"].platformAccessory
          ]);
          resolve();
        });
      });

      homebridge.emit("didFinishLaunching");

      expect(Object.keys(platform.accessoriesByIntegrationID)).toEqual(["2"]);
      expect(platform.accessoriesByIntegrationID["2"]).toBeInstanceOf(
        LutronAccessory
      );
    });

    it("doesn't attempt to re-add cached accessories from config", () => {
      const cachedPlatformAccessory = new PlatformAccessory(
        "Display Name",
        UUID.generate("bogus")
      );
      cachedPlatformAccessory.context.config = {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "test remote"
      };
      platform.configureAccessory(cachedPlatformAccessory);

      homebridge.registerPlatformAccessories = jest.fn();

      homebridge.emit("didFinishLaunching");

      expect(homebridge.registerPlatformAccessories.mock.calls).toEqual([]);
    });

    it("updates cached accessories from config", () => {
      const cachedPlatformAccessory = new PlatformAccessory(
        "Display Name",
        UUID.generate("bogus")
      );
      cachedPlatformAccessory.context.config = {
        type: "PICO-REMOTE",
        integrationID: 2,
        name: "bogus"
      };
      platform.configureAccessory(cachedPlatformAccessory);

      homebridge.emit("didFinishLaunching");

      expect(cachedPlatformAccessory.context.config.name).toEqual(
        "test remote"
      );
    });

    describe("type = PICO-REMOTE", () => {
      // TODO: handle multiple remote types.
      it("builds an accessory with stateless programmable switch services", () => {
        expect.assertions(1);

        const accessoriesRegisteredPromise = new Promise(resolve => {
          homebridge.once("registerPlatformAccessories", accessories => {
            const accessory = platform.accessoriesByIntegrationID["2"];
            const switchServices = accessory.platformAccessory.services.filter(
              s =>
                s instanceof homebridge.hap.Service.StatelessProgrammableSwitch
            );

            expect(switchServices.length).toEqual(2);

            resolve();
          });
        });

        homebridge.emit("didFinishLaunching");

        return accessoriesRegisteredPromise;
      });

      it("updates services on cached platform accessories", () => {
        const cachedPlatformAccessory = new PlatformAccessory(
          "Display Name",
          UUID.generate("bogus")
        );
        cachedPlatformAccessory.context.config = {
          type: "PICO-REMOTE",
          integrationID: 2,
          name: "bogus"
        };
        const bogusService = new homebridge.hap.Service.StatelessProgrammableSwitch(
          "Switch bogus",
          "2"
        );
        cachedPlatformAccessory.addService(bogusService);
        platform.configureAccessory(cachedPlatformAccessory);

        homebridge.emit("didFinishLaunching");

        const accessory = platform.accessoriesByIntegrationID["2"];
        const switchNames = accessory.platformAccessory.services
          .filter(
            s => s instanceof homebridge.hap.Service.StatelessProgrammableSwitch
          )
          .map(s => s.displayName);

        expect(switchNames.length).toEqual(2);
        expect(switchNames).toEqual(["Switch 2", "Switch 4"]);
      });
    });
  });

  describe("with fake server", () => {
    let server, serverSocket;
    beforeEach(() => {
      const debug = false;

      server = new FakeServer({ debug: debug });

      server.listeningPromise.then(address => {
        const platformConfig = Object.assign({}, baseConfig, {
          bridgeConnection: {
            host: address.address,
            port: address.port,
            debug: debug
          }
        });
        platform = new LutronCasetaPlatform(
          console.log,
          platformConfig,
          homebridge
        );
      });

      const serverSocketSetup = server.connectionReceivedPromise.then(
        connection => {
          serverSocket = connection.socket;
        }
      );

      const bridgeSocketSetup = server.listeningPromise.then(() => {
        return new Promise(resolve => {
          platform.bridgeConnection.socket.once("connect", () => {
            resolve();
          });
        });
      });
      return Promise.all([serverSocketSetup, bridgeSocketSetup]);
    });

    afterEach(() => {
      const closePromise = new Promise(resolve => {
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
      const service = accessory.platformAccessory.getServiceByUUIDAndSubType(
        homebridge.hap.Service.StatelessProgrammableSwitch,
        "4"
      );
      const characteristic = service.getCharacteristic(
        homebridge.hap.Characteristic.ProgrammableSwitchEvent
      );

      accessory._dispatchMonitorMessage = jest.fn();

      platform.bridgeConnection.on("loggedIn", () => {
        serverSocket.write("~DEVICE,2,4,3");
      });

      return new Promise(resolve => {
        platform.bridgeConnection.on("monitorMessageReceived", () => {
          expect(accessory._dispatchMonitorMessage.mock.calls).toEqual([
            [["4", "3"]]
          ]);
          resolve();
        });
      });
    });
  });
});
