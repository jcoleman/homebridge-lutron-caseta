// @ts-check
const {
  ConnectionEvent,
  CasetaBridgeConnection
} = require("./caseta-bridge-connection");
const { LutronAccessory } = require("./lutron-accessory");
const { PluginName, PlatformName } = require("./common");

class LutronCasetaPlatform {
  constructor(log, config, api) {
    if (!config) {
      log("No config found; exiting.");
      return;
    }
    this.log = log;
    this.config = config;
    this.homebridgeAPI = api;

    this.bridgeConnection = new CasetaBridgeConnection(
      this.log,
      this.config.bridgeConnection
    );
    this.bridgeConnection.on(
      ConnectionEvent.MonitorMessageReceived,
      (integrationID, commandFields) => {
        this._dispatchMonitorMessage(integrationID, commandFields);
      }
    );

    this.accessoriesByIntegrationID = {};

    this.homebridgeAPI.on("didFinishLaunching", () => {
      for (let accessoryConfig of this.config.accessories) {
        accessoryConfig.integrationID = String(accessoryConfig.integrationID);
        this._addAccessoryFromConfig(accessoryConfig);
      }
    });
  }

  // Homebridge uses this API to load accessories from its cache.
  configureAccessory(platformAccessory) {
    this._addAccessoryFromConfig(
      platformAccessory.context.config,
      platformAccessory
    );
  }

  _trackAccessory(accessory) {
    this.accessoriesByIntegrationID[accessory.integrationID] = accessory;
  }

  _addAccessoryFromConfig(accessoryConfig, cachedPlatformAccessory = null) {
    const existingAccessory = this.accessoriesByIntegrationID[
      accessoryConfig.integrationID
    ];
    let needToRegisterPlatformAccessory = false;
    if (cachedPlatformAccessory === null) {
      if (existingAccessory) {
        cachedPlatformAccessory = existingAccessory.platformAccessory;
      } else {
        const uuid = this.homebridgeAPI.hap.uuid.generate(accessoryConfig.name);
        cachedPlatformAccessory = new this.homebridgeAPI.platformAccessory(
          accessoryConfig.name,
          uuid
        );
        needToRegisterPlatformAccessory = true;
      }
      cachedPlatformAccessory.context.config = accessoryConfig;
    }

    if (existingAccessory === undefined) {
      const accessory = LutronAccessory.accessoryForType(
        accessoryConfig.type,
        this.log,
        cachedPlatformAccessory,
        this.homebridgeAPI
      );
      this._trackAccessory(accessory);
    }

    if (needToRegisterPlatformAccessory) {
      this.homebridgeAPI.registerPlatformAccessories(PluginName, PlatformName, [
        cachedPlatformAccessory
      ]);
    }
  }

  _dispatchMonitorMessage(integrationID, commandFields) {
    const accessory = this.accessoriesByIntegrationID[integrationID];
    accessory._dispatchMonitorMessage(commandFields);
  }
}

module.exports = {
  LutronCasetaPlatform
};
