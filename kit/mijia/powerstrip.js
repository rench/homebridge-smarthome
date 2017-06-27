const Base = require('./base');
const miio = require('miio');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class PowerStrip extends Base {
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
  setPowerStrip(config, channel, device) {
    let sid = config.id;
    let model = device.model;
    let uuid = UUIDGen.generate('Mijia-PowerStrip@' + sid)
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      let name = sid;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.FAN);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia PowerStrip")
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
    //bind
    let setter = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setter || setter.length == 0) {
      //service
      service.getCharacteristic(Characteristic.On).on('get', (callback) => {
        let device = this.devices[sid];
        let status = false;
        if (device != undefined) {
          status = device.power;

        }
        callback(null, status);
      }).on('set', (value, callback) => {
        let device = this.devices[sid];
        if (device != undefined && value) {
          device.setPower(channel, value ? true : false);
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
      if (!reg.token) { //power strip support Auto-token
        return;
      }
      miio.device(reg).then((device) => {
        if (device.type != this.model) {
          return;
        }
        this.devices[reg.id] = device;
        this.mijia.log.debug('find model->%s with hostname->%s id->%s  @ %s:%s.', device.model, reg.hostname, device.id, device.address, device.port);
        this.setPowerStrip(reg, 0, device);
      });
    });

    browser.on('unavailable', (reg) => {
      if (!reg.token) { // support Auto-token
        return;
      }
      if (this.devices[reg.id] != undefined) {
        this.devices[reg.id].destroy();
        delete this.devices[reg.id];
      }
    });
  }

}

module.exports = PowerStrip;