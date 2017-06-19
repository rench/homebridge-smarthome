var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen;
var homebridge;
const winston = require('winston');
const util = require('util');
const broadlink = require('./broadlink');
class Broadlink {
  // config may be null
  // api may be null if launched from old homebridge version
  constructor(log, config, api) {
    this.PlatformAccessory = PlatformAccessory;
    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    this.log = log;
    this.config = config;
    this.devices = {};
    this.accessories = {};
    if (api) {
      // Save the API object as plugin needs to register new accessory via this object.
      this.api = api;
    } else {
      this.log.error("Homebridge's version is too old, please upgrade!");
    }
    if (this.api) {
      this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    }
    if (homebridge.broadlink != undefined) {
      homebridge.broadlink = this;
    }
    this.log.debug('broadlink constructor done');
  }
  static init() {
    return new Promise((resolve, reject) => {
      homebridge.registerPlatform("homebridge-smarthome", "smarthome", Broadlink, true);
      resolve();
    });
  }
  didFinishLaunching() {
    let { broadlink } = config;
    if (broadlink != undefined) {
      let { devices } = broadlink;
      if (devices && devices.length > 0) { //for wifi devices
        devices.map((device) => {
          let { name, type, mac, ip } = device;
          if (type == 'MP1' || type == 'MP2') {
            for (let i = 1; i <= 4; i++) { //mp1 and mp2(two usb devices) have 4 plug
              let mp = new broadlink.MP(this);
              let deviceCfg = util.inherits({}, device);
              deviceCfg.name = name + '@' + i;
              mp.init(deviceCfg);
            }
          }
        });
      }
    }
  }
}


module.exports = (homebridge) => {
  //export some properties from homebridge
  PlatformAccessory = homebridge.platformAccessory;
  Accessory = homebridge.hap.Accessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  homebridge = homebridge;
  //init mikit
  return Broadlink.init(homebridge);
}