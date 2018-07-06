class LutronAccessory {
	constructor(log, platformAccessory, api) {
    this.log = log;
    this.platformAccessory = platformAccessory;
    this.config = platformAccessory.context.config;
    this.homebridge = api;

    this.integrationID = this.config.integrationID;
  }
}

export default LutronAccessory;
