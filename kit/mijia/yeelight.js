const miio = require('miio');
const Base = require('./base');
const color = require('../../util/color');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Yeelight extends Base {
  constructor(mijia, config) {
    super(mijia);
    this.config = config;
    this.model = config.model;
    this.devices = {}; //all yeelight devices
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
    this.discover();
  }
  /**
   * discover yeelight on the localnetwork
   */
  discover() {
    this.mijia.log.debug('try to discover ' + this.model);
    let browser = miio.browse(); //require a new browse
    browser.on('available', (reg) => {
      if (!reg.token) { //support Auto-token
        return;
      }
      miio.device(reg).then((device) => {
        this.devices[reg.id] = device;
        this.mijia.log.debug('find model->%s with hostname->%s id->%s  @ %s:%s.', device.model, reg.hostname, device.id, device.address, device.port);
        this.setLightbulb(reg, device);
      });
    });

    browser.on('unavailable', (reg) => {
      if (!reg.token) { //support Auto-token
        return;
      }
      if (this.devices[reg.id] != undefined) {
        this.devices[reg.id].destroy();
        delete this.devices[reg.id];
      }
    });
  }
  /**
   * set up Lightbulb Service 
   * @param {* reg} reg 
   * @param {* device} device 
   */
  setLightbulb(reg, device) {
    let sid = reg.id;
    let model = device.model;
    let uuid = UUIDGen.generate('Mijia-PowerPlug@' + sid)
    let supportColor = device.model == 'yeelink.light.color1';
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.LIGHTBULB);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Yeelight Lightbulb")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Lightbulb(name);
      //add optional characteristic intent to display color menu in homekit app
      service.addCharacteristic(Characteristic.Brightness);
      if (supportColor) {
        service.addCharacteristic(Characteristic.Hue);
        service.addCharacteristic(Characteristic.Saturation);
      }
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Lightbulb);
    }
    accessory.reachable = true;
    accessory.context.sid = sid;
    accessory.context.model = 'yeelight';

    let power = device.power;
    //update Characteristics
    if (power != undefined) {
      service.getCharacteristic(Characteristic.On).updateValue(power);
    } else {
      service.getCharacteristic(Characteristic.On).updateValue(false);
    }
    if (supportColor) {
      let rgb = device.rgb;
      if (rgb == undefined) {
        rgb = { red: 255, green: 255, blue: 255 };
      }
      let hsv = color.rgb2hsv(red, green, blue);
      service.getCharacteristic(Characteristic.Hue).updateValue(hsv[0]);
      service.getCharacteristic(Characteristic.Saturation).updateValue(hsv[1]);
      accessory.context.lastRgb = rgb;
    }
    //bind set event if not set
    var setters = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setters || setters.length == 0) {
      service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
        let device = this.devices[sid];
        this.mijia.log.debug(`set yeelight on->${value}`);
        if (device) {
          device.setPower(value ? true : false);
        }
        callback();
      });

      service.getCharacteristic(Characteristic.Brightness).on('set', (value, callback) => {
        this.mijia.log.debug(`set yeelight brightness->${value}`);
        let device = this.devices[sid];
        if (device) {
          device.setBrightness(value);
        }
        accessory.context.lastBrightness = value;
        callback();
      });
      if (supportColor) {
        service.getCharacteristic(Characteristic.Saturation).on('set', (value, callback) => {
          this.mijia.log.debug(`set yeelight Saturation->${value}`);
          if (value != undefined) {
            accessory.context.lastSaturation = value;
          }
          callback();
        });
        service.getCharacteristic(Characteristic.Hue).on('set', (value, callback) => {
          this.mijia.log.debug(`set yeelight Hue->${value}`);
          let device = this.devices[sid];
          let lastSaturation = accessory.context.lastSaturation;
          lastSaturation = lastSaturation ? lastSaturation : 100;
          let lastBrightness = accessory.context.lastBrightness;
          lastBrightness = lastBrightness ? lastBrightness : 100;
          let rgb = color.hsv2rgb(value, lastSaturation, lastBrightness); //convert hue and sat to rgb value
          accessory.context.lastRgb = rgb;
          accessory.context.lastHue = value;
          if (device) {
            device.setRgb({ red: rgb[0], green: rgb[1], blue: rgb[2] });
          }
          callback();
        });
      }

    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }
}
module.exports = Yeelight;