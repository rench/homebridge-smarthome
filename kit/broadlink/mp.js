const Broadlink_lib = require('./broadlink');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class MP {
  constructor(broadlink) {
    this.broadlink = broadlink;
    this.config = {};
    PlatformAccessory = broadlink.PlatformAccessory;
    Accessory = broadlink.Accessory;
    Service = broadlink.Service;
    Characteristic = broadlink.Characteristic;
    UUIDGen = broadlink.UUIDGen;
  }
  init(config) {
    this.config = config;
    this.index = config.name.split('@')[1];
    this.powered = false; //default off
    this.macBuffer = this.macStringToMacBuff(config.mac);
    let uuid = UUIDGen.generate('Broadlink-' + config.name);
    let accessory = this.broadlink.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = config.name;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SWITCH);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Broadlink")
        .setCharacteristic(Characteristic.Model, "Broadlink " + this.config.type)
        .setCharacteristic(Characteristic.SerialNumber, config.mac);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Switch(name);
      accessory.addService(service, name);
      this.broadlink.log.debug('init a new broadlink accessory->' + this.config);
    } else {
      service = accessory.getService(Service.Switch);
    }
    accessory.reachable = true;
    let setters = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setters || setters.length == 0) {
      service.getCharacteristic(Characteristic.On).on('set', this.setSwitchStatus.bind(this));
      service.getCharacteristic(Characteristic.On).on('get', this.getSwitchStatus.bind(this));
    }
    if (!this.broadlink.accessories[uuid]) {
      this.broadlink.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;

  }
  /**
   * set the mp switch status
   * @param {* value} value 
   * @param {* callback} callback 
   */
  setSwitchStatus(value, callback) {
    this.broadlink.log.debug('set mp device switch status ->' + value);
    let lib = new Broadlink_lib();
    let state = false; //power state
    let retry = 1;
    let callbacked = false;
    if (value && !this.powered) {
      state = true;
    } else if (!value && this.powered) {
      state = false;
    } else {
      callback(null, this.powered);
      return;
    }
    lib.on('deviceReady', (dev) => {
      if (this.macBuffer.equals(dev.mac) || dev.host.address == this.config.ip) {
        clearInterval(checkAgainSet);
        dev.set_power(this.index, state);
        dev.exit();
        this.powered = state;
        callbacked = true;
        callback(null, this.powered);
      } else {
        dev.exit();
        if (retry > 2) {
          clearInterval(checkAgainSet);
          callbacked = true;
          callback(null, this.powered);
          this.broadlink.log.warn('Broadlink setSwitchStatus discover after 3 times,but not found match device');
        }
      }
    });
    lib.discover(300);
    let checkAgainSet = setInterval(() => {
      if (retry > 2) {
        clearInterval(checkAgainSet);
        return;
      }
      lib.discover(300);
      retry++;
    }, 500); //re-discover after 0.5s for 2 times
    let callbackTimeout = setTimeout(() => {
      if (!callbacked) {
        callback(null, this.powered);
      }
    }, 2000); //callback after 2s whatever
  }

  getSwitchStatus(callback) {
    this.broadlink.log.debug('get mp devices switch status');
    let lib = new Broadlink_lib();
    let retry = 1;
    let callbacked = false;
    lib.on('deviceReady', (dev) => {
      if (this.macBuffer.equals(dev.mac) || dev.host.address == self.ip) {
        clearInterval(checkAgainSet);
        dev.check_power();
        dev.on("mp_power", (status_array) => {
          dev.exit();
          if (!status_array[this.index - 1]) {
            this.powered = false;
            callbacked = true;
            callback(null, false);
          } else {
            this.powered = true;
            callbacked = true;
            callback(null, true);
          }
        });
      } else {
        dev.exit();
        if (retry > 2) {
          clearInterval(checkAgainSet);
          callbacked = true;
          callback(null, this.powered);
          this.broadlink.log.warn('Broadlink getSwitchStatus discover after 3 times,but not found match device');
        }
      }
    });
    lib.discover(300);
    let checkAgainSet = setInterval(() => {
      if (retry > 2) {
        clearInterval(checkAgainSet);
        return;
      }
      lib.discover(300);
      retry++;
    }, 500); //re-discover after 0.5s for 2 times
    let callbackTimeout = setTimeout(() => {
      if (!callbacked) {
        callback(null, this.powered);
      }
    }, 2000); //callback after 2s whatever
  }

  /**
  * registry accessories to homekit
  * @param {*accessories} accessories 
  */
  registerAccessory(accessories) {
    this.broadlink.api.registerPlatformAccessories("homebridge-smarthome", "smarthome-broadlink", accessories);
  }
  /**
   * macString to mac buffer
   * @param {* mac} mac 
   */
  macStringToMacBuff(mac) {
    var mb = new Buffer(6);
    if (mac) {
      var values = mac.split(':');
      if (!values || values.length !== 6) {
        throw new Error('Invalid MAC [' + mac + ']; should follow pattern ##:##:##:##:##:##');
      }
      for (var i = 0; i < values.length; ++i) {
        var tmpByte = parseInt(values[i], 16);
        mb.writeUInt8(tmpByte, i);
      }
    }
    return mb;
  }


}
module.exports = MP;