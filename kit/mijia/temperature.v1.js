const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen, CommunityTypes;
class TemperatureV1 extends Base {
  constructor(mijia) {
    super(mijia);
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
    CommunityTypes = mijia.CommunityTypes;
  }
  /**
 * parse the gateway json msg
 * @param {*json} json 
 * @param {*remoteinfo} rinfo 
 */
  parseMsg(json, rinfo) {
    let { cmd, model, sid } = json;
    let data = JSON.parse(json.data);
    let { voltage, temperature } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} temperature->${temperature}`);
    if (temperature != undefined) {
      this.setTemperatureSensor(sid, voltage, temperature);
    }
  }
  /**
   * set up TemperatureSensor(mijia temperature and humidity sensor)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device temperature} temperature 
   */
  setTemperatureSensor(sid, voltage, temperature) {
    let uuid = UUIDGen.generate('Aqara-TemperatureSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Aqara")
        .setCharacteristic(Characteristic.Model, "Aqara TemperatureSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.TemperatureSensor(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(Service.TemperatureSensor);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'weather.v1';
    if (temperature != undefined) {
      service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(temperature / 100);
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = TemperatureV1;