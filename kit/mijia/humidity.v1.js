const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class HumidityV1 extends Base {
  constructor(mijia) {
    super(mijia);
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
  }
  /**
   * parse the gateway json msg
   * @param {*json} json 
   * @param {*remoteinfo} rinfo 
   */
  parseMsg(json, rinfo) {
    let { cmd, model, sid } = json;
    let data = JSON.parse(json.data);
    let { voltage, humidity } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} humidity->${humidity}`);
    if (humidity != undefined) {
      this.setHumiditySensor(sid, voltage, humidity);
    }
  }
  /**
   * setup humiditysensor
   * @param {*} sid 
   * @param {*} voltage 
   * @param {*} humidity 
   */
  setHumiditySensor(sid, voltage, humidity) {
    let uuid = UUIDGen.generate('Aqara-HumiditySensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Aqara")
        .setCharacteristic(Characteristic.Model, "Aqara HumiditySensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.HumiditySensor(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(Service.HumiditySensor);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'weather.v1';
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
}
module.exports = HumidityV1;