const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen, CommunityTypes;
class PressureV1 extends Base {
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
    let { voltage, pressure } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} pressure->${pressure}`);
    if (pressure != undefined) {
      this.setPressureSensor(sid, voltage, pressure);
    }
  }
  /**
   * set up PressureSensor(aqara pressure and humidity sensor)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device pressure} pressure 
   */
  setPressureSensor(sid, voltage, pressure) {
    let uuid = UUIDGen.generate('Aqara-PressureSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Aqara")
        .setCharacteristic(Characteristic.Model, "Aqara PressureSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new CommunityTypes.AtmosphericPressureSensor(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(CommunityTypes.AtmosphericPressureSensor);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'weather.v1';
    if (pressure != undefined) {
      service.getCharacteristic(Characteristic.AtmosphericPressureLevel).updateValue(pressure);
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = PressureV1;