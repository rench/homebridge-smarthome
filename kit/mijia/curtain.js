const Base = require('./base');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Curtain extends Base {
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
    let { status, curtain_level } = data;
    this.mijia.log.debug(`${model} ${cmd} status->${status} curtain_level->${curtain_level}`);
    this.setWindowCovering(sid, status, curtain_level);
  }
  /**
   * set up WindowCovering(mijia curtain)
   * @param {*device id} sid 
   * @param {*device status} status 
   * @param {*device curtain_level} curtain_level 
   */
  setWindowCovering(sid, status, curtain_level) {
    let uuid = UUIDGen.generate('Mijia-Curtain@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.WINDOW_COVERING);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Curtain")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.WindowCovering(name);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.WindowCovering);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'curtain';
    //
    if (curtain_level == undefined) {
      curtain_level = 100;
    }
    accessory.context.curtain_level = curtain_level;
    accessory.context.currentPosition = curtain_level;
    if (accessory.context.targetPosition == undefined) {
      accessory.context.targetPosition = curtain_level;
    }
    service.getCharacteristic(Characteristic.CurrentPosition).updateValue(accessory.context.currentPosition);
    setPositionState(accessory, service);
    let setters = service.getCharacteristic(Characteristic.CurrentPosition).listeners('set');
    if (!setters || setters.length == 0) {
      service.getCharacteristic(Characteristic.TargetPosition).on('set', function (value, callback) {
        accessory.context.targetPosition = value;
        if (accessory.context.targetPosition != accessory.context.currentPosition) {
          let data = { curtain_level: value };
          data.key = this.mijia.generateKey(sid);
          let cmd = { cmd: 'write', model: 'curtain', sid: sid, data: JSON.stringify(data) };
          this.mijia.sendMsgToSid(cmd, sid);
        }
        callback();
      });
      service.getCharacteristic(Characteristic.TargetPosition).on('get', function (callback) {
        callback(null, accessory.context.targetPosition);
      });
      service.getCharacteristic(Characteristic.CurrentPosition).on('get', function (callback) {
        callback(null, accessory.context.currentPosition);
      });
    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;
  }
  /**
   * set up window covering state
   * @param {* accessory} accessory 
   * @param {* service} service 
   */
  setPositionState(accessory, service) {
    let positionState = Characteristic.PositionState.STOPPED;
    if (accessory.context.targetPosition > accessory.context.currentPosition) {
      positionState = Characteristic.PositionState.INCREASING;
    } else if (accessory.context.targetPosition < accessory.context.currentPosition) {
      positionState = Characteristic.PositionState.DECREASING;
    }
    service.getCharacteristic(Characteristic.PositionState).updateValue(positionState);
  }
}
module.exports = Curtain;