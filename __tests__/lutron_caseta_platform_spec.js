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
  describe("without fake server", () => {
    const emitter = new EventEmitter();
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

    it("tracks an accessory from Homebridge's cache", () => {
      const homebridge = new API();
      const platform = new LutronCasetaPlatform(() => { }, baseConfig, homebridge);
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

      const homebridge = new API();
      const platform = new LutronCasetaPlatform(() => { }, baseConfig, homebridge);
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
  });
});
