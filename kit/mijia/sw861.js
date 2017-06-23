const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class SW861 extends Base {
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
    let { voltage, channel_0 } = data;
    this.mijia.log.debug(`${model} ${cmd} voltage->${voltage} channel_0->${channel_0}`);
    this.setSwitch(sid, voltage, channel_0);
  }
  /**
   * set up Switch(mijia 86sw1)
   * @param {*device id} sid 
   * @param {*device voltage} voltage 
   * @param {*device channel} channel 
   */
  setSwitch(sid, voltage, channel) {
    let uuid = UUIDGen.generate('Mijia-86SW1@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.PROGRAMMABLE_SWITCH);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia 86SW1")
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
    accessory.context.sid = sid;
    accessory.context.model = '86sw1';
    if (channel != undefined) {
      var event = service.getCharacteristic(Characteristic.ProgrammableSwitchEvent);
      if (status == 'click') {
        event.updateValue(Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS); //0
      } else if (status == 'double_click') {
        event.updateValue(Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS); //1
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
module.exports = SW861;