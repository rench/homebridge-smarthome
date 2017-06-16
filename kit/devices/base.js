var Accessory, PlatformAccessory, Service, Characteristic, UUIDGen;
class Base {
  constructor(mijia) {
    this.mijia = mijia;
  }
  /**
   * return true if the zigbee devices battery level is low 
   * @param {*voltage} voltage 
   */
  isBatteryLow(voltage) {
    return isNaN(voltage) ? true : (voltage > 2800 ? true : false);
  }
  /**
   * return the devices battery level in homekit
   * @param {*} voltage 
   */
  getBatteryLevel(voltage) {
    return isNaN(voltage) ? 0 : ((voltage - 2800) / 5);
  }

  registerAccessory(accessories) {
    this.mijia.api.registerPlatformAccessories("homebridge-smarthome", "smarthome", accessories);
  }
  /**
   * parse msg receive from gateway
   * @param {*} msg 
   * @param {*} rinfo 
   */
  parseMsg(msg, rinfo) {
    this.mijia.log.warn('base device parseMsg -> %s', JSON.parse(msg));
  }
}

module.exports = Base;