const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Magnet extends Base {
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
    let { voltage, status } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} status->${status}`);
    this.setContactSensor(sid, voltage, status);
  }
  /**
   * set up ContactSensor(mijia door and window sensors)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device status} status 
   */
  setContactSensor(sid, voltage, status) {
    let uuid = UUIDGen.generate('Mijia-ContactSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let sub = sid.substring(sid.length - 4);
    let name = `Contact ${this.mijia.sensor_names[sub] ? this.mijia.sensor_names[sub] : sub}`
    if (!accessory) {
      //init a new homekit accessory
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia ContactSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      accessory.addService(new Service.ContactSensor(name), name);
      accessory.addService(new Service.BatteryService(name), name);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'magnet';

    var service = accessory.getService(Service.ContactSensor);
    if (!service) {
      service = accessory.addService(new Service.ContactSensor(name), name);
    }
    
    service.getCharacteristic(Characteristic.ContactSensorState)
      .updateValue(status === 'close' ? Characteristic.ContactSensorState.CONTACT_DETECTED : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED)

    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = Magnet;