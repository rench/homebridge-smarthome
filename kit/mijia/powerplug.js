const Base = require('./base');
const miio = require('miio');
const util = require('util');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;

class PowerPlug extends Base {
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

  setPowerPlug(reg, channel, device) {
    let sid = reg.id;
    let model = device.model;
    let uuid = UUIDGen.generate('Mijia-PowerPlug@' + sid)
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      let name = `Plug ${this.mijia.sensor_names[sid] ? this.mijia.sensor_names[sid] : sub}`
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.FAN);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia PowerPlug")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Outlet(name); // outlet
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Outlet);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = this.model;

    //update Characteristics
    let status = false;
    if (device != undefined) {
      if (model == 'chuangmi.plug.v1') {
        if (channel == 'main') {
          status = device.on;
        } else if (channel == 'usb') {
          status = device.usb_on;
        }
      } else {
        status = device.power(device.powerChannels[channel]);
      }
      this.mijia.log.warn(`PLUG ${util.inspect(status)}`)
      service.getCharacteristic(Characteristic.On).updateValue(status ? status : false);

      device.on('propertyChanged', (e) => {
        this.mijia.log.warn(`PROPERTY CHANGED ${util.inspect(e)}`)
        if (e.property === device.powerChannels[channel]) {
          service.getCharacteristic(Characteristic.On).updateValue(e.value)
        }
      })
    }

    //bind
    let setter = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setter || setter.length == 0) {
      let log = this.mijia.log
      service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined && value != undefined) {
          device.setPower(device.powerChannels[channel], value ? true : false)
            .catch((e) => {
              log.error(`SET PLUG ERROR ${e}`)
            });
        }
        callback();
      });
    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  discover() {
    let browser = miio.browse(); //require a new browse
    browser.on('available', (reg) => {
      if (reg.type != this.model) {
        return;
      }
      if (!reg.token) { //power plug support Auto-token
        return;
      }
      this.mijia.log.warn(`FIND POWER PLUG ${reg.id} - ${reg.address}`)
      miio.device(reg).then((device) => {
        if (device.type != this.model) {
          return;
        }
        this.devices[reg.id] = device;
        if (device.model == 'chuangmi.plug.v1') {
          this.setPowerPlug(reg, 'main', device);
          this.setPowerPlug(reg, 'usb', device);
        } else {
          this.setPowerPlug(reg, 0, device);
        }
        this.mijia.log.warn(`POWER PLUG CONNECTED ${reg.id} - ${reg.address}`)
      }).catch((error) => {
        this.mijia.log.error(`POWER PLUG ERROR ${error}`)
      });
    });

    browser.on('unavailable', (reg) => {
      if (!reg.token) { //airpurifier support Auto-token
        return;
      }
      if (this.devices[reg.id] != undefined) {
        this.devices[reg.id].destroy();
        delete this.devices[reg.id];
      }
    });
  }

}

module.exports = PowerPlug;