const Base = require('./base');
const miio = require('miio');
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
      let name = sid;
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
    //bind
    let setter = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setter || setter.length == 0) {
      //service
      service.getCharacteristic(Characteristic.On).on('get', (callback) => {
        let device = this.devices[sid];
        let status = false;
        if (device != undefined) {
          if (model == 'chuangmi.plug.v1') {
            if (channel == 'main') {
              status = device.on;
            } else if (channel == 'usb') {
              status = device.usb_on;
            }
          } else {
            status = device.power;
          }
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
      if (!reg.token) { //power plug support Auto-token
        return;
      }
      miio.device(reg).then((device) => {
        if (device.type != this.model) {
          return;
        }
        this.devices[reg.id] = device;
        this.mijia.log.debug('find power plug with hostname->%s id->%s @ %s:%s.', reg.hostname, device.id, device.address, device.port);
        if (device.model == 'chuangmi.plug.v1') {
          this.setPowerPlug(reg, 'main', device);
          this.setPowerPlug(reg, 'usb', device);
        } else {
          this.setPowerPlug(reg, 0, device);
        }
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

module.exports = PowerPlug;