class Base {
  constructor(mijia) {
    this.mijia = mijia;
    this.Accessory = mijia.Accessory;
    this.PlatformAccessory = mijia.PlatformAccessory;
    this.Service = mijia.Service;
    this.Characteristic = mijia.Characteristic;
    this.UUIDGen = mijia.UUIDGen;
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