// @ts-check
const ButtonState = {
  BUTTON_DOWN: "3",
  BUTTON_UP: "4"
};

class LutronAccessory {
  static accessoryForType(type, log, platformAccessory, api) {
    if (type !== "PICO-REMOTE") {
      log(`Unknown accessory type: ${type}`);
    }
    return new LutronPicoRemoteAccessory(log, platformAccessory, api);
  }

  constructor(log, platformAccessory, api) {
    this.log = log;
    this.platformAccessory = platformAccessory;
    this.config = platformAccessory.context.config;
    this.homebridgeAPI = api;
    this.integrationID = this.config.integrationID;
  }
}

class LutronPicoRemoteAccessory extends LutronAccessory {
  constructor(log, platformAccessory, api) {
    super(log, platformAccessory, api);

    const StatelessProgrammableSwitch = this.homebridgeAPI.hap.Service
      .StatelessProgrammableSwitch;
    this.switchServicesByButtonNumber = ["2", "4"].reduce((acc, number) => {
      const displayName = `Switch ${number}`;

      let existingService = this.platformAccessory.getServiceByUUIDAndSubType(
        StatelessProgrammableSwitch,
        number
      );
      if (existingService && existingService.displayName != displayName) {
        this.platformAccessory.removeService(existingService);
        existingService = null;
      }

      let service;
      if (existingService) {
        service = existingService;
      } else {
        service = new this.homebridgeAPI.hap.Service.StatelessProgrammableSwitch(
          displayName,
          number
        );
        this.platformAccessory.addService(service);
      }

      acc[number] = service;

      return acc;
    }, {});
  }

  _dispatchMonitorMessage(commandFields) {
    const [serviceNumber, buttonState] = commandFields;
    if (buttonState == ButtonState.BUTTON_UP) {
      const service = this.switchServicesByButtonNumber[serviceNumber];
      const characteristic = service.getCharacteristic(
        this.homebridgeAPI.hap.Characteristic.ProgrammableSwitchEvent
      );
      characteristic.setValue(0);
    }
  }
}

module.exports = {
  ButtonState,
  LutronAccessory
};
