const Base = require('./base');
const miio = require('miio');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class AirPurifier extends Base {
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
  setAirPurifier(reg, device) {
    let sid = reg.id;
    let uuid = UUIDGen.generate('Mijia-AirPurifier@' + sid)
    let accessory = this.mijia.accessories[uuid];
    let service_air, service_air_sensor, service_temperature, service_humidity, service_led;
    if (!accessory) {
      let name = sid;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.AirPurifier);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia AirPurifier")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service_air = new Service.AirPurifier(name); // airpurifier
      accessory.addService(service_air, name);
      service_air_sensor = new Service.AirQualitySensor(name);
      accessory.addService(service_air_sensor, name);
      service_temperature = new Service.TemperatureSensor(name);
      accessory.addService(service_temperature, name);
      service_humidity = new Service.HumiditySensor(name);
      accessory.addService(service_humidity, name);
      service_led = new Service.Lightbulb(name);
      accessory.addService(service_led, name);
    } else {
      service_air = accessory.getService(Service.AirPurifier);
      service_air_sensor = accessory.getService(Service.AirQualitySensor);
      service_temperature = accessory.getService(Service.TemperatureSensor);
      service_humidity = accessory.getService(Service.HumiditySensor);
      service_led = accessory.getService(Service.Lightbulb);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = this.model;
    //bind
    let setter = service_air.getCharacteristic(Characteristic.Active).listeners('set');
    if (!setter || setter.length == 0) {
      //service_air
      service_air.getCharacteristic(Characteristic.Active).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          callback(null, device.power ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
        } else {
          callback(null, Characteristic.Active.INACTIVE);
        }
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          device.setPower(value == Characteristic.Active.ACTIVE ? true : false);
        }
        callback(null, value);
      });

      //
      service_air.getCharacteristic(Characteristic.TargetAirPurifierState).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          //'idle','auto','silent','favorite'
          if (value == Characteristic.TargetAirPurifierState.AUTO) {
            device.setMode('auto');
          } else {
            device.setMode('idle');
          }
        }
        callback(null, value);
      });

      service_air.getCharacteristic(Characteristic.CurrentAirPurifierState).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
            return;
          }
          //'idle','auto','silent','favorite'
          if (device.mode == 'auto' || device.mode == 'silent' || device.mode == 'favorite') {
            callback(null, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
          } else if (device.mode == 'idle') {
            callback(null, Characteristic.CurrentAirPurifierState.IDLE);
          }
        } else {
          callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
        }
      });

      service_air.getCharacteristic(Characteristic.CurrentAirPurifierState).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
            return;
          }
          //'idle','auto','silent','favorite'
          if (device.mode == 'auto' || device.mode == 'silent' || device.mode == 'favorite') {
            callback(null, Characteristic.CurrentAirPurifierState.PURIFYING_AIR);
          } else if (device.mode == 'idle') {
            callback(null, Characteristic.CurrentAirPurifierState.IDLE);
          }
        } else {
          callback(null, Characteristic.CurrentAirPurifierState.INACTIVE);
        }
      });

      service_air.getCharacteristic(Characteristic.RotationSpeed).on('get', (callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback();
            return;
          }
          if (device.mode == 'idle') {
            callback(null, 25);
          } else if (device.mode == 'silent') {
            callback(null, 50);
          } else if (device.mode == 'auto') {
            callback(null, 75);
          } else if (device.mode == 'favorite') {
            callback(null, 100);
          }
          callback();
        }
        callback();
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback();
            return;
          }
          if (value > 0 && value <= 25) {
            device.setMode('idle');
          } else if (value > 25 && value <= 50) {
            device.setMode('silent');
          } else if (value > 50 && value <= 75) {
            device.setMode('auto');
          } else if (value > 75 && value <= 100) {
            device.setMode('favorite');
          }
          callback(null, value);
        } else {
          callback();
        }
      });
      //service_air_sensor
      service_air_sensor.getCharacteristic(Characteristic.AirQuality).on('get', (callback) => {
        let device = this.devices[sid];
        let value = Characteristic.AirQuality.UNKNOWN;
        if (device != undefined) {
          if (!device.power) {
            callback();
            return;
          }
          let levels = [
            [200, Characteristic.AirQuality.POOR],
            [150, Characteristic.AirQuality.INFERIOR],
            [100, Characteristic.AirQuality.FAIR],
            [50, Characteristic.AirQuality.GOOD],
            [0, Characteristic.AirQuality.EXCELLENT],
          ];
          for (let level in levels) {
            if (device.aqi > level[0]) {
              value = level[1];
            }
          };
        }
        callback(null, value);
      });
      //service_temperature
      service_temperature.getCharacteristic(Characteristic.CurrentTemperature).on('get', (callback) => {
        let device = this.devices[sid];
        let value = 0;
        if (device != undefined) {
          if (!device.power) {
            callback(null, value);
            return;
          }
          value = device.temperature;
        }
        callback(null, value);
      });
      //service_humidity
      service_humidity.getCharacteristic(Characteristic.CurrentRelativeHumidity).on('get', (callback) => {
        let device = this.devices[sid];
        let value = 0;
        if (device != undefined) {
          if (!device.power) {
            callback(null, value);
            return;
          }
          value = device.humidity;
        }
        callback(null, value);
      });
      //service_led
      service_led.getCharacteristic(Characteristic.On).on('get', (callback) => {
        let device = this.devices[sid];
        let value = false;
        if (device != undefined) {
          if (!device.power) {
            callback(null, value);
            return;
          }
          value = device.led;
        }
        callback(null, value);
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback(null, fasle);
            return;
          }
          device.setLed(value);
        }
        callback(null, value);
      });

      service_led.getCharacteristic(Characteristic.Brightness).on('get', (callback) => {
        let device = this.devices[sid];
        let value = false;
        if (device != undefined) {
          if (!device.power) {
            callback(null, value);
            return;
          }
          value = device.ledBrightness;
        }
        callback(null, value);
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined) {
          if (!device.power) {
            callback(null, fasle);
            return;
          }
          if (value > 50) {
            device.setLedBrightness('bright');
          } else if (value > 15) {
            device.setLedBrightness('dim');
          } else {
            device.setLedBrightness('off');
          }
        }
        callback(null, value);
      });
    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  discover() {
    this.mijia.log.debug('try to discover ' + this.model);
    let browser = miio.browse(); //require a new browse
    browser.on('available', (reg) => {
      if (!reg.token) { //airpurifier support Auto-token
        return;
      }
      miio.device(reg).then((device) => {
        if (device.type != this.model) {
          return;
        }
        this.devices[reg.id] = device;
        this.mijia.log.debug('find air-purifier with hostname->%s id->%s @ %s:%s.', reg.hostname, device.id, device.address, device.port);
        this.setAirPurifier(reg, device);
      });
    });

    browser.on('unavailable', (reg) => {
      if (!reg.token) { //airpurifier support Auto-token
        return;
      }
      if (this.devices[reg.id]) {
        this.devices[reg.id].destroy();
        delete this.devices[reg.id];
      }
    });
  }

}

module.exports = AirPurifier;