const Base = require("./base");
const miio = require("miio");
const util = require("util");
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
    let uuid = UUIDGen.generate("Mijia-PowerPlug@" + sid);
    let accessory = this.mijia.accessories[uuid];
    if (!accessory) {
      let name = `Plug ${
        this.mijia.sensor_names[sid] ? this.mijia.sensor_names[sid] : sub
      }`;
      accessory = new PlatformAccessory(name, uuid, Accessory.Categories.FAN);
      accessory
        .getService(Service.AccessoryInformation)
        .setCharacteristic(Characteristic.Manufacturer, "Mijia")
        .setCharacteristic(Characteristic.Model, "Mijia PowerPlug")
        .setCharacteristic(Characteristic.SerialNumber, sid);
      accessory.on("identify", function(paired, callback) {
        callback();
      });
      accessory.addService(new Service.Outlet(name), name);
    }
    accessory.reachable = true;
    accessory.updateReachability(true);
    accessory.context.sid = sid;
    accessory.context.model = this.model;

    let service = accessory.getService(Service.Outlet);

    //update Characteristics
    let status = false;
    if (device != undefined) {
      if (model == "chuangmi.plug.v1") {
        if (channel == "main") {
          status = device.on;
        } else if (channel == "usb") {
          status = device.usb_on;
        }
      } else {
        status = device.power(device.powerChannels[channel]);
      }

      device.on("propertyChanged", e => {
        this.mijia.log.debug(
          `PowerPlug ${sid} - ${
            device.powerChannels[channel]
          } changed: ${JSON.stringify(e)}`
        );
        if (e.property == `powerChannel${channel}`) {
          service.getCharacteristic(Characteristic.On).updateValue(e.value);
        }
      });
      device.monitor(5000)
        .catch(e => { this.mijia.log.error(`PowerPlug ${sid} monitor ${e}`) })
    }

    //bind
    var setters = service.getCharacteristic(Characteristic.On).listeners("set");
    if (!setters || setters.length == 0) {
      service
        .getCharacteristic(Characteristic.On)
        .on("set", (value, callback) => {
          let device = this.devices[sid];
          if (device != undefined && value != undefined) {
            device
              .setPower(device.powerChannels[channel], value ? true : false)
              .catch(e => {
                this.mijia.log.error(`SET PLUG ERROR ${e}`);
              });
          }
          callback();
        }).value = status;
    }

    if (!this.mijia.accessories[uuid]) {
      this.mijia.accessories[uuid] = accessory;
      this.registerAccessory([accessory]);
    }
  }

  discover() {
    let browser = miio.browse(); //require a new browse
    browser.on("available", reg => {
      if (reg.type != this.model) {
        return;
      }
      if (!reg.token) {
        //power plug support Auto-token
        return;
      }
      this.mijia.log.debug(`FIND POWER PLUG ${reg.id} - ${reg.address}`);
      miio
        .device(reg)
        .then(device => {
          if (device.type != this.model) {
            return;
          }
          this.devices[reg.id] = device;
          if (device.model == "chuangmi.plug.v1") {
            this.setPowerPlug(reg, "main", device);
            this.setPowerPlug(reg, "usb", device);
          } else {
            this.setPowerPlug(reg, 0, device);
          }
          this.mijia.log.debug(
            `POWER PLUG CONNECTED ${reg.id} - ${reg.address}`
          );
        })
        .catch(error => {
          this.mijia.log.error(`POWER PLUG ERROR ${error}`);
        });
    });

    browser.on("unavailable", reg => {
      if (!reg.token) {
        //airpurifier support Auto-token
        return;
      }
      if (this.devices[reg.id] != undefined) {
        let accessory = this.mijia.accessories[UUIDGen.generate("Mijia-PowerPlug@" + reg.id)]
        if (accessory) {
          accessory.updateReachability(false);
          accessory.reachable = false;
        }
        this.devices[reg.id].destroy();
        delete this.devices[reg.id];
      }
    });
  }
}

module.exports = PowerPlug;
