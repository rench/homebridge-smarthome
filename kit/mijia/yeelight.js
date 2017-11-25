const util = require("util");
const Base = require("./base");
const YeeAgent = require("./yee");
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

class Yeelight extends Base {
  constructor(mijia, config) {
    super(mijia);
    this.config = config;
    this.model = config.model;
    this.devices = {}; //all yeelight devices
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
    this.discover();
  }
  /**
   * discover yeelight on the localnetwork
   */
  discover() {
    let platform = this;
    let agent = new YeeAgent("0.0.0.0", this.mijia, platform);
    agent.startDisc();
  }

  onDevFound(device) {
    let { accessory, service, supportColor } = this.getLightBulb(device);
    service.getCharacteristic(Characteristic.On).updateValue(device.power);
    service
      .getCharacteristic(Characteristic.Brightness)
      .updateValue(device.bright);
    if (supportColor) {
      service
        .getCharacteristic(Characteristic.Saturation)
        .updateValue(device.sat);
      service.getCharacteristic(Characteristic.Hue).updateValue(device.hue);
    }
  }

  onDevConnected(device) {
    let { accessory, service, supportColor } = this.getLightBulb(device);
    accessory.updateReachability(true);
    accessory.reachable = true;
    service.getCharacteristic(Characteristic.On).updateValue(device.power);
    service
      .getCharacteristic(Characteristic.Brightness)
      .updateValue(device.bright);
    if (supportColor) {
      service
        .getCharacteristic(Characteristic.Saturation)
        .updateValue(device.sat);
      service.getCharacteristic(Characteristic.Hue).updateValue(device.hue);
    }
  }

  onDevDisconnected(device) {
    this.mijia.log.warn(`YEELIGHT ${device.did} DISCONNECTED`);
    let { accessory, service, supportColor } = this.getLightBulb(device);
    accessory.updateReachability(false);
    accessory.reachable = false;
  }

  onDevPropChange(device, prop, val) {
    this.mijia.log.warn(
      `YEELIGHT ${device.did} | ${prop} -> ${val}`
    );
    let { accessory, service } = this.getLightBulb(device);
    accessory.updateReachability(true);
    accessory.reachable = true;
    switch (prop) {
      case "power":
        service.getCharacteristic(Characteristic.On).updateValue(val ? true : false);
        break
      case "bright":
        service.getCharacteristic(Characteristic.Brightness).updateValue(val);
        break
      case "sat":
        service.getCharacteristic(Characteristic.Saturation).updateValue(val);
        break
      case "hue":
        service.getCharacteristic(Characteristic.Hue).updateValue(val);
        break
    }
  }

  getLightBulb(device) {
    let sid = device.did.substring(device.did.length - 8);
    let supportColor = device.model === "color";
    let uuid = UUIDGen.generate("Mijia-LightBulb@" + sid);
    let accessory = this.mijia.accessories[uuid];
    if (!accessory) {
      let name = `${
        this.mijia.sensor_names[sid] ? this.mijia.sensor_names[sid] : sid
      }`;
      accessory = new PlatformAccessory(
        name,
        uuid,
        Accessory.Categories.LIGHTBULB
      );
      accessory
        .getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Yeelight Lightbulb")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on("identify", function(paired, callback) {
        callback();
      });
      let service = new Service.Lightbulb(name);
      //add optional characteristic intent to display color menu in homekit app
      service.addCharacteristic(Characteristic.Brightness);
      if (supportColor) {
        service.addCharacteristic(Characteristic.Hue);
        service.addCharacteristic(Characteristic.Saturation);
      }
      accessory.addService(service, name);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = "yeelight";

    //bind set event if not set
    let service = accessory.getService(Service.Lightbulb);
    var setters = service.getCharacteristic(Characteristic.On).listeners("set");
    if (!setters || setters.length == 0) {
      service
        .getCharacteristic(Characteristic.On)
        .on("set", (value, callback) => {
          this.mijia.log.debug(`Yeelight ${device.did} power:${value}`);
          device.setPower(value ? true : false);
          callback();
        });

      service
        .getCharacteristic(Characteristic.Brightness)
        .on("set", (value, callback) => {
          this.mijia.log.debug(`Yeelight ${device.did} brightness:${value}`);
          device.setBright(value);
          callback();
        });

      if (supportColor) {
        service
          .getCharacteristic(Characteristic.Saturation)
          .on("set", (value, callback) => {
            this.mijia.log.debug(`Yeelight ${device.did} saturation:${value}`);
            device.setColor(device.hue, value);
            callback();
          });

        service
          .getCharacteristic(Characteristic.Hue)
          .on("set", (value, callback) => {
            this.mijia.log.debug(`Yeelight ${device.did} hue:${value}`);
            device.setColor(value, device.sat);
            callback();
          });
      }
    }

    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return { accessory, service, supportColor };
  }
}
module.exports = Yeelight;
