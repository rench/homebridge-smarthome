const Base = require('./base');
const miio = require('miio');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Vacuum extends Base {
  constructor(mijia, config) {
    super(mijia);
    this.config = config;
    this.model = config.model;
    this.devices = {}; //all airpurifier devices
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
    this.discover();
  }
  setVacuum(config, device) {
    let sid = config.sid;
    let uuid = UUIDGen.generate('Mijia-Vacuum@' + sid)
    let accessory = this.mijia.accessories[uuid];
    let service_fan, service_battery;
    if (!accessory) {
      let name = sid;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.FAN);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Vacuum")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
        let device = this.devices[sid];
        if (device != undefined) {
          device.find(); //find me,will make the device give off a sound.
        }
      });
      service_fan = new Service.Fan(name); // Fan
      accessory.addService(service_fan, name);
      service_battery = new Service.BatteryService(name);
      accessory.addService(service_battery, name);
    } else {
      service_fan = accessory.getService(Service.Fan);
      service_battery = accessory.getService(Service.BatteryService);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = this.model;
    //bind
    let setter = service_fan.getCharacteristic(Characteristic.On).listeners('set');
    if (!setter || setter.length == 0) {
      //service_fan
      service_fan.getCharacteristic(Characteristic.On).on('get', (callback) => {
        let device = this.devices[sid];
        let status = false;
        if (device != undefined) {
          let state = device.state;
          switch (state) {
            case 'cleaning':
            case 'returning':
            case 'paused':
            case 'spot-cleaning': {
              status = true;
              break;
            }
            default:
              status = false;
          }
        }
        callback(null, status);
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined && value) {
          device.start();
        } else {
          device.pause();
          device.charge(); //go to home(app_stop && app_charge)
        }
        callback(null, value);
      });
      service_fan.getCharacteristic(Characteristic.RotationSpeed).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (device.state == 'paused') {
            callback();
            return;
          }
          callback(null, device.fanPower);
          return;
        }
        callback();
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          let speeds = [
            0,
            38,
            60,
            77,
            90
          ];
          for (let item in speeds) {
            if (value <= item) {
              value = item;
              break;
            }
          }
          device.setFanPower(value);
          if (value == 0) {
            device.pause();
          }
          callback(null, speed);
        } else {
          callback();
        }
      });
      //battery service
      service_battery.getCharacteristic(Characteristic.BatteryLevel).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          callback(null, device.battery);
        } else {
          callback();
        }
      });
      service_battery.getCharacteristic(Characteristic.StatusLowBattery).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          callback(null, device.battery < 20); //like ios 
        } else {
          callback();
        }
      });
      service_battery.getCharacteristic(Characteristic.ChargingState).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          callback(null, device.charging);
        } else {
          callback();
        }
      });
    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  discover() {
    this.mijia.log.debug('try to discover ' + this.model);
    if (this.config.sid == undefined) {
      this.config.sid = this.config.ip; //change sid
    }
    //create device
    let device = miio.device({
      address: this.config.ip,
      token: this.config.token,
      model: 'rockrobo.vacuum.v1'
    }).then(() => {
      this.mijia.log.debug('init vacuum done->%s', this.config.ip);
      this.mijia.log.debug('Battery->%s,State->%s,Fan->%s', device.battery, device.state, device.fanPower);
      if (device.state != undefined) {
        this.setVacuum(this.config, device);
        this.devices[this.config.sid] = device;
      } else {
        this.mijia.log.warn('vacuum state undefined, discard to setVacuum');
        device.destroy();
      }
    }).catch((err) => {
      this.mijia.log.debug(err);
      this.mijia.log.error('unable to initialize robot vacuum->%s', this.config.ip);
    });
  }

}

module.exports = Vacuum;