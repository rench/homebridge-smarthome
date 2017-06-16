const Base = require('./base');
let Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
class Contact extends Base {
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
    let { voltage, status } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} status->${status}`);
    this.setContactSensor(sid, voltage, status);
  }

  setContactSensor(sid, voltage, status) {
    let uuid = UUIDGen.generate('Mijia-ContactSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia ContactSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.ContactSensor(name);
      accessory.addService(service, name);
      this.mijia.accessories[uuid] = accessory;
    } else {
      service = accessory.getService(Service.ContactSensor);
    }
    accessory.reachable = true;
    if (status == 'closed') {
      service.getCharacteristic(Characteristic.ContactSensorState).updateValue(Characteristic.ContactSensorState.CONTACT_DETECTED);
    } else {
      service.getCharacteristic(Characteristic.ContactSensorState).updateValue(Characteristic.ContactSensorState.CONTACT_NOT_DETECTED);
    }
    setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }

  setBatteryService(sid, voltage, accessory) {


  }
}