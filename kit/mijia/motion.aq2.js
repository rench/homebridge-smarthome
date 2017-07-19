const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class MotionAq2 extends Base {
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
    let { voltage, status, lux } = data; //lux->0~1200
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} status->${status} lux->${lux}`);
    if (status != undefined) {
      this.setMotionSensor(sid, voltage, status);
    }
    if (lux != undefined) {
      this.setLightSensor(sid, lux);
    }
  }
  /**
   * set up MotionSensor(aqara motion sensor)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device status} status 
   */
  setMotionSensor(sid, voltage, status) {
    let uuid = UUIDGen.generate('Aqara-MotionSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Aqara")
        .setCharacteristic(Characteristic.Model, "Aqara MotionSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.MotionSensor(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(Service.MotionSensor);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'sensor_motion.aq2';
    if (status != undefined) {
      service.getCharacteristic(Characteristic.MotionDetected).updateValue('motion' == status);
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }


  /**
   * set up LightSensor(aqara lightsensor)
   * @param {*device id} sid 
   * @param {*device lux value} lux 
   */
  setLightSensor(sid, lux) {
    let uuid = UUIDGen.generate('Aqara-LightSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Aqara")
        .setCharacteristic(Characteristic.Model, "Aqara LightSensor")
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
    accessory.context.sid = sid;
    accessory.context.model = 'sensor_motion.aq2';
    service.getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(lux);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }
}
module.exports = MotionAq2;