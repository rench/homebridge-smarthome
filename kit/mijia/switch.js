const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Switch extends Base {
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
    this.setSwitch(sid, voltage, status)
  }
  /**
   * set up Switch(mijia Switch)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device status} status 
   */
  setSwitch(sid, voltage, status) {
    let uuid = UUIDGen.generate('Mijia-Switch@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.PROGRAMMABLE_SWITCH);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Switch")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.StatelessProgrammableSwitch(name);
      accessory.addService(service, name);
      accessory.addService(new Service.BatteryService(name), name);
    } else {
      service = accessory.getService(Service.StatelessProgrammableSwitch);
    }
    accessory.reachable = true;
    if (status != undefined) {
      var event = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent);
      if (status == 'click') {
        event.updateValue(Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
      } else if (status == 'double_click') {
        event.updateValue(Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS);
      } else if (status == 'long_click_release') {
        event.updateValue(Characteristic.ProgrammableSwitchEvent.LONG_PRESS);
      }
    }
    this.setBatteryService(sid, voltage, accessory);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = Switch;