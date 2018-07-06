import CasetaBridgeConnection from "./caseta_bridge_connection.js"

class LutronCasetaPlatform {
	constructor(log, config, api) {
		if (!config) {
      log("No config found; exiting.");
      return;
    }

    this.log = log;
    this.config = config;
    this.homebridge = api;

    this.accessories = [];
  }

  configureAccessory(platformAccessory) {

  }

  trackAccessory(accessory) {
    this.accessories.push(accessory);
  }
}

export default LutronCasetaPlatform;
