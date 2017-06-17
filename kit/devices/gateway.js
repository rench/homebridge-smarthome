const Base = require('./base');
const colors = require('../../util/colors');
let PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
class Gateway extends Base {
  constructor(mijia) {
    super(mijia);
    PlatformAccessory = mijia.PlatformAccessory;
    Accessory = mijia.Accessory;
    Service = mijia.Service;
    Characteristic = mijia.Characteristic;
    UUIDGen = mijia.UUIDGen;
  }
  parseMsg(json, rinfo) {
    let { cmd, model, sid } = json;
    let data = JSON.parse(json.data);
    let { rgb, illumination, proto_version, mid } = data;
    this.mijia.log.debug(`${model} ${cmd} rgb->${rgb} illumination->${illumination} proto_version->${proto_version}`);
    if (illumination != undefined) {
      this.setLightSensor(sid, illumination);
    }
    if (rgb != undefined) {
      this.setLightbulb(sid, rgb);
    }
  }
  setLightSensor(sid, illumination) {
    let uuid = UUIDGen.generate('Gateway-LightSensor@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.SENSOR);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Gateway LightSensor")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.LightSensor(name);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.LightSensor);
    }
    accessory.reachable = true;
    service.getCharacteristic(Characteristic.CurrentAmbientLightLevel).updateValue(illumination);
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  setLightbulb(sid, rgb) {
    let uuid = UUIDGen.generate('Gateway-Lightbulb@' + sid);
    let accessory = this.mijia.accessories[uuid];
    let service;
    if (!accessory) {
      //init a new homekit accessory
      let name = sid.substring(sid.length - 4);
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.LIGHTBULB);
      accessory.getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia Gateway Lightbulb")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on('identify', function (paired, callback) {
        callback();
      });
      service = new Service.Lightbulb(name);
      service.addCharacteristic(Characteristic.Hue);
      service.addCharacteristic(Characteristic.Saturation);
      service.addCharacteristic(Characteristic.Brightness);
      accessory.addService(service, name);
    } else {
      service = accessory.getService(Service.Lightbulb);
    }
    accessory.reachable = true;
    if (!accessory.ctx) {
      accessory.ctx = {};
    }
    //update Characteristics
    let brightness = (rgb & 0xFF000000) >>> 24;
    let red = (rgb & 0x00FF0000) >>> 16;
    let green = (rgb & 0x0000FF00) >>> 8;
    let blue = rgb & 0x000000FF;
    if (rgb == 0 || brightness == 0) {
      service.getCharacteristic(Characteristic.On).updateValue(false);
    } else {
      service.getCharacteristic(Characteristic.On).updateValue(true);
      let hueColor = colors.rgb_to_hkhue(red, green, blue);
      let hue = hueColor.hue;
      let sat = hueColor.sat;
      service.getCharacteristic(Characteristic.Brightness).updateValue(brightness);
      service.getCharacteristic(Characteristic.Hue).updateValue(hue);
      service.getCharacteristic(Characteristic.Saturation).updateValue(sat);
      accessory.ctx.lastRgb = rgb;
    }
    //bind set event if not set
    var setters = service.getCharacteristic(Characteristic.On).listeners('set');
    if (!setters || setters.length == 0) {
      service.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
        this.mijia.log.debug(accessory.ctx);
        let data = {
          rgb: 0,
          key: ''
        }
        this.mijia.log.debug(`set gateway light on->${value}`);
        if (value) { //if value is true or 1
          let lastRgb = accessory.ctx.lastRgb;
          if (lastRgb == undefined) {
            data.rgb = 0xFFFFFFFF; //default
            accessory.ctx.lastRgb = data.rgb;
          } else {
            data.rgb = accessory.ctx.lastRgb;
          }
          accessory.ctx.count = 1;
        } else {
          accessory.ctx.count = 0;
        }
        data.key = this.mijia.generateKey(sid);
        let cmd = { cmd: 'write', model: 'gateway', sid: sid, data: JSON.stringify(data) }
        this.mijia.sendMsgToSid(cmd, sid);
        callback();
      });

      service.getCharacteristic(Characteristic.Brightness).on('set', (value, callback) => {
        this.mijia.log.debug(`set gateway light brightness->${value}`);
        if (accessory.ctx.count != undefined && accessory.ctx.count == 1 && value == 100) {
          this.mijia.log.warn(`discard set brightness->${value} when turn on the light`);
        } else {
          let data = {
            rgb: 0,
            key: ''
          }
          let lastRgb = accessory.ctx.lastRgb;
          lastRgb = lastRgb ? lastRgb : 0xFFFFFFFF;
          let rgb = value << 24 | (lastRgb & 0x00FFFFFF);
          data.rgb = rgb;
          data.key = this.mijia.generateKey(sid);
          let cmd = { cmd: 'write', model: 'gateway', sid: sid, data: JSON.stringify(data) }
          this.mijia.sendMsgToSid(cmd, sid);
          accessory.ctx.lastRgb = rgb;
        }
        accessory.ctx.count = 2;
        callback();
      });

      service.getCharacteristic(Characteristic.Saturation).on('set', (value, callback) => {
        this.mijia.log.debug(`set gateway light Saturation->${value}`);
        if (value != undefined) {
          accessory.ctx.lastSaturation = value;
        }
        callback();
      });

      service.getCharacteristic(Characteristic.Hue).on('set', (value, callback) => {
        this.mijia.log.debug(`set gateway light Hue->${value}`);
        let data = {
          rgb: 0,
          key: ''
        }
        let lastRgb = accessory.ctx.lastRgb;
        let lastSaturation = accessory.ctx.lastSaturation;
        lastSaturation = lastSaturation ? lastSaturation : 100;
        let lastBrightness = (lastRgb & 0xFF000000) >>> 24;
        let rgbArr = colors.hkhue_to_rgb(value, lastSaturation); //convert hue and sat to rgb value
        let r = rgbArr[0];
        let g = rgbArr[1];
        let b = rgbArr[2];
        let rgb = r << 16 | g << 8 | b;
        rgb = rgb | (lastBrightness << 24);
        this.mijia.log.debug(`set gateway light rgb->${rgb}`);
        data.rgb = rgb;
        data.key = this.mijia.generateKey(sid);
        let cmd = { cmd: 'write', model: 'gateway', sid: sid, data: JSON.stringify(data) }
        this.mijia.sendMsgToSid(cmd, sid);
        accessory.ctx.lastRgb = rgb;
        callback();
      });

    }
    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }
}
module.exports = Gateway;