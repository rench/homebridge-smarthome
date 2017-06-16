const Base = require('./base');
let Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
class Gateway extends Base {
  constructor(mijia) {
    super(mijia);
    Accessory = mijia.Accessory;
    PlatformAccessory = mijia.PlatformAccessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
  }
  parseMsg(json, rinfo) {
    let { cmd, model, sid } = json;
    let data = JSON.parse(json.data);
    let { rgb, illumination, proto_version, mid } = data;
    this.mijia.log.debug(`${model} ${cmd} rgb->${rgb} illumination->${illumination} proto_version->${proto_version}`);
    if (illumination != undefined) {
      setLightSensor(sid, illumination);
    }
    if (rgb != undefined) {
      setLightbulb(sid, rgb);
    }
  }
  setLightSensor(sid, illumination) {
    let uuid = UUIDGen.generate('Gateway-LightSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Gateway LightSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.LightSensor(name);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.LightSensor);
    }
    accessory.reachable = true;
    service.getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(illumination);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  setLightbulb(sid, rgb) {
    let uuid = UUIDGen.generate('Gateway-Lightbulb@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.LIGHTBULB);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Gateay Lightbulb")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Lightbulb(name);
      service.addCharacteristic(Characteristic.Hue);
      service.addCharacteristic(Characteristic.Saturation);
      service.addCharacteristic(Characteristic.Brightness);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Lightbulb);
    }
    accessory.reachable = true;
    //set hue
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }
}