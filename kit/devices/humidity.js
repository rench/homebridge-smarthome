const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Humidity extends Base {
  constructor(mijia) {
    super(mijia);
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
  }
  parseMsg(json, rinfo) {
    let { cmd, model, sid } = json;
    let data = JSON.parse(json.data);
    let { voltage, humidity } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} humidity->${humidity}`);
    this.setHumiditySensor(sid, voltage, humidity)
  }

  setHumiditySensor(sid, voltage, humidity) {
    let uuid = UUIDGen.generate('Mijia-HumiditySensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia HumiditySensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.HumiditySensor(name);
      accessory.addService(service, name);
      accessory.addService(Service.BatteryService, name);
    } else {
      service = accessory.getService(Service.HumiditySensor);
    }
    accessory.reachable = true;
    if (humidity != undefined) {
      service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(humidity / 100);
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
  setBatteryService(sid, voltage, accessory) {
    let service = accessory.getService(Service.BatteryService);
    if (voltage != undefined) {
      let isBatteryLow = this.isBatteryLow(voltage);
      let batteryLevel = this.getBatteryLevel(voltage);
      service.getCharacteristic(Characteristic.StatusLowBattery).updateValue(isBatteryLow);
      service.getCharacteristic(Characteristic.BatteryLevel).updateValue(batteryLevel);
      service.getCharacteristic(Characteristic.ChargingState).updateValue(false);
    }

  }
}
module.exports = Humidity;