const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Natgas extends Base {
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
    let { voltage, alarm } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} alarm->${alarm}`);
    this.setSmokeSensor(sid, voltage, alarm);
  }
  /**
   * set up NatgasSensor(mijia natgas sensors)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device alarm} alarm 
   */
  setSmokeSensor(sid, voltage, alarm) {
    let uuid = UUIDGen.generate('Mijia-NatgasSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia NatgasSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.SmokeSensor(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(Service.SmokeSensor);
    }
    accessory.reachable = true;
    if (alarm == 0) { //Release alarm
      service.getCharacteristic(Characteristic.SmokeDetected).updateValue(false);
      service.getCharacteristic(Characteristic.StatusActive).updateValue(true);
      service.getCharacteristic(Characteristic.StatusFault).updateValue(Characteristic.StatusFault.NO_FAULT);
    } else if (alarm == 1 || alarm == 2) { // 1: Fire alarm 2: Analog alarm
      service.getCharacteristic(Characteristic.SmokeDetected).updateValue(true);
      service.getCharacteristic(Characteristic.StatusActive).updateValue(true);
      service.getCharacteristic(Characteristic.StatusFault).updateValue(Characteristic.StatusFault.NO_FAULT);
    } else if (alarm == 64 || alarm == 32768) { //64: Sensitivity fault alarm 32768: IIC communication failure
      service.getCharacteristic(Characteristic.SmokeDetected).updateValue(false);
      service.getCharacteristic(Characteristic.StatusActive).updateValue(false);
      service.getCharacteristic(Characteristic.StatusFault).updateValue(Characteristic.StatusFault.GENERAL_FAULT);
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = Natgas;