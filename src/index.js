// @ts-check
const { LutronCasetaPlatform } = require("./lutron-caseta-platform");
const { PluginName, PlatformName } = require("./common");
let Accessory, Service, Characteristic, UUIDGen;

module.exports = function (homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(
    PluginName,
    PlatformName,
    LutronCasetaPlatform,
    true
  );
}
