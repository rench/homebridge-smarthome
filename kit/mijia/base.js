let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Base {
  constructor(mijia) {
    this.mijia = mijia;
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
  }
  /**
   * return true if the zigbee devices battery level is low 
   * @param {*voltage} voltage 
   */
  isBatteryLow(voltage) {
    return isNaN(voltage) ? true : (voltage > 2800 ? false : true);
  }
  /**
   * return the devices battery level in homekit
   * @param {*} voltage 
   */
  getBatteryLevel(voltage) {
    return isNaN(voltage) ? 0 : ((voltage - 2800) / 400 * 100);
  }
  /**
 * setup 
 * @param {*device id} sid 
 * @param {*device voltage} voltage 
 * @param {*device homekit accessory} accessory 
 */
  setBatteryService(sid, voltage, accessory) {
    let service = accessory.getService(Service.BatteryService);
    if (voltage != undefined && service != undefined) {
      let isBatteryLow = this.isBatteryLow(voltage);
      let batteryLevel = this.getBatteryLevel(voltage);
      service.getCharacteristic(Characteristic.StatusLowBattery).updateValue(isBatteryLow);
      service.getCharacteristic(Characteristic.BatteryLevel).updateValue(batteryLevel);
      service.getCharacteristic(Characteristic.ChargingState).updateValue(false);
    }
  }
  /**
  * setup 
  * @param {*device id} sid 
  * @param {*device batteryLevel} batteryLevel 
  * @param {*device isBatteryLow} isBatteryLow 
  * @param {*device chargingState} chargingState 
  * @param {*device homekit accessory} accessory 
  */
  setBatteryServiceV2(sid, batteryLevel, isBatteryLow, chargingState, accessory) {
    let service = accessory.getService(Service.BatteryService);
    if (batteryLevel != undefined) {
      service.getCharacteristic(Characteristic.BatteryLevel).updateValue(batteryLevel);
    }
    if (isBatteryLow != undefined) {
      service.getCharacteristic(Characteristic.StatusLowBattery).updateValue(isBatteryLow);
    }
    if (chargingState != undefined) {
      service.getCharacteristic(Characteristic.ChargingState).updateValue(chargingState);
    }
  }
  /**
   * registry accessories to homekit
   * @param {*accessories} accessories 
   */
  registerAccessory(accessories) {
    this.mijia.api.registerPlatformAccessories("homebridge-smarthome", "smarthome-mijia", accessories);
  }
    /**
   * unregistry accessories to homekit
   * @param {*accessories} accessories 
   */
  unregisterAccessory(accessories) {
    this.mijia.api.unregisterPlatformAccessories("homebridge-smarthome", "smarthome-mijia", accessories);
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