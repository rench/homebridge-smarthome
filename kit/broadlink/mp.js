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
        .setCharacteristic(Characteristic.Model, "Broadlink MP")
        .setCharacteristic(Characteristic.SerialNumber, config.mac);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Switch(name);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Switch);
    }
    accessory.reachable = true;
    let setters = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setters || setters.length == 0) {
      service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
        let lib = new Broadlink_lib();
        let state = false; //power state
        if (value && !this.powered) {
          state = true;
        } else if (!value && this.powered) {
          state = false;
        } else {
          callback(null, this.powered);
        }
        lib.discover(500);
        let retry = 1;
        var checkAgainSet = setInterval(function () {
          lib.discover();
          retry++;
        }, 1000);
        lib.on('deviceReady', (dev) => {
          if (this.macBuffer.equals(dev.mac) || dev.host.address == self.ip) {
            clearInterval(checkAgainSet);
            //this device
            dev.set_power(this.index, state);
            dev.exit();
            this.powered = state;
          } else {
            dev.exit();
            if (retry > 3) {
              clearInterval(checkAgainSet);
              callback(null, this.powered);
            }
          }
        });
      });
      service.getCharacteristic(Characteristic.On).on('get', (callback) => {
        let lib = new Broadlink_lib();
        lib.discover(500);
        let retry = 1;
        var checkAgainSet = setInterval(function () {
          lib.discover();
          retry++;
        }, 1000);
        lib.on('deviceReady', (dev) => {
          if (this.macBuffer.equals(dev.mac) || dev.host.address == self.ip) {
            clearInterval(checkAgainSet);
            //this device
            dev.check_power();
            dev.on("mp_power", (status_array) => {
              dev.exit();
              if (!status_array[this.index - 1]) {
                this.powered = false;
                return callback(null, false);
              } else {
                this.powered = true;
                return callback(null, true);
              }
            });
          } else {
            dev.exit();
            if (retry > 3) {
              clearInterval(checkAgainSet);
              callback(null, this.powered);
            }
          }
        });
      });
    }
    if (!this.broadlink.accessories[uuid]) {
      this.broadlink.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
    return accessory;

  }

  /**
  * registry accessories to homekit
  * @param {*accessories} accessories 
  */
  registerAccessory(accessories) {
    this.broadlink.api.registerPlatformAccessories("homebridge-smarthome", "smarthome", accessories);
  }

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
    } else {
      //this.log("MAC address emtpy, using IP: " + this.ip);
    }
    return mb;
  }


}
module.exports = MP;