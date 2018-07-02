let Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-lutron-caseta", "Lutron Caseta Smart Bridge Pro", HomebridgeLutronCaseta, true);
}

class HomebridgeLutronCaseta {
	constructor(log, config, api) {
		if (!config) {
      log("No config found; exiting.");
      return;
    }

    this.log = log;
    this.config = config;
    this.HomebridgeAPI = api;
  }
}
