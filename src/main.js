import LutronCasetaPlatform from "./lutron_caseta_platform.js"

let Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform("homebridge-lutron-caseta", "Lutron Caseta Smart Bridge Pro", LutronCasetaPlatform, true);
}


