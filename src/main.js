import LutronCasetaPlatform from "./lutron_caseta_platform.js"

const PluginName = "homebridge-lutron-caseta";
const PlatformName = "Lutron Caseta Smart Bridge Pro";
let Accessory, Service, Characteristic, UUIDGen;

export default function(homebridge) {
  Accessory = homebridge.platformAccessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform(PluginName, PlatformName, LutronCasetaPlatform, true);
}

export {PluginName, PlatformName};
