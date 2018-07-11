import * as Main from "../src/main.js"
import CasetaBridgeConnection from "./caseta_bridge_connection.js"
import LutronAccessory from "../src/lutron_accessory.js";

class LutronCasetaPlatform {
	constructor(log, config, api) {
		if (!config) {
      log("No config found; exiting.");
      return;
    }

    this.log = log;
    this.config = config;
    this.homebridgeAPI = api;

    this.bridgeConnection = new CasetaBridgeConnection(this.log, this.config.bridgeConnection);
    this.bridgeConnection.on("monitorMessageReceived", (integrationID, commandFields) => {
      this._dispatchMonitorMessage(integrationID, commandFields);
    });

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
    this._addAccessoryFromConfig(platformAccessory.context.config);
  }

  _trackAccessory(accessory) {
    this.accessoriesByIntegrationID[accessory.integrationID] = accessory;
  }

  _addAccessoryFromConfig(accessoryConfig, cachedPlatformAccessory=null) {
    let needToRegisterPlatformAccessory = false;
    if (cachedPlatformAccessory === null) {
      const uuid = this.homebridgeAPI.hap.uuid.generate(accessoryConfig.name);
      cachedPlatformAccessory = new this.homebridgeAPI.platformAccessory(accessoryConfig.name, uuid);
      cachedPlatformAccessory.context.config = accessoryConfig;
      needToRegisterPlatformAccessory = true;
    }

    const accessory = LutronAccessory.accessoryForType(accessoryConfig.type, this.log, cachedPlatformAccessory, this.homebridgeAPI);
    this._trackAccessory(accessory);

    if (needToRegisterPlatformAccessory) {
      this.homebridgeAPI.registerPlatformAccessories(Main.PluginName, Main.PlatformName, [cachedPlatformAccessory]);
    }
  }

  _dispatchMonitorMessage(integrationID, commandFields) {
    const accessory = this.accessoriesByIntegrationID[integrationID];
    accessory._dispatchMonitorMessage(commandFields);
  }
}

export default LutronCasetaPlatform;
