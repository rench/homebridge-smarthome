const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class CtrlLN1 extends Base {
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
    let { channel_0 } = data;
    this.mijia.log.debug(`${model} ${cmd} channel_0->${channel_0}`);
    this.setSwitch(sid, channel_0);
  }
  /**
   * set up Switch(mijia CtrlNeutral1)
   * @param {*device id} sid 
   * @param {*device channel} channel 
   */
  setSwitch(sid, channel) {
    let uuid = UUIDGen.generate('Mijia-CtrlLN1@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SWITCH);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia CtrlLN1")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Switch(name);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Switch);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'ctrl_ln1';
    if (channel != undefined) {
      var event = service.getCharacteristic(Characteristic.On);
      if (channel == 'on') {
        event.updateValue(true);
      } else {
        event.updateValue(false);
      }
    }
    //bind set event if not set
    let setter = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setter || setter.length == 0) {
      service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
        let data = { channel_0: value ? 'on' : 'off' };
        data.key = this.mijia.generateKey(sid);
        let cmd = { cmd: 'write', model: 'ctrl_ln1', sid: sid, data: JSON.stringify(data) };
        this.mijia.sendMsgToSid(cmd, sid);
        callback();
      });
    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
}
module.exports = CtrlLN1;