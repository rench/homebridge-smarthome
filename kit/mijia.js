let Accessory, Service, Characteristic, UUIDGen;

const miio = require('miio');
const dgram = require('dgram');
const inherits = require('util').inherits;
const crypto = require('crypto');
const iv = Buffer.from([0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58, 0x56, 0x2e]);
const multicastIp = '224.0.0.50';
const multicastPort = 4321;
const udpPort = 9898;

class Mijia {
  // config may be null
  // api may be null if launched from old homebridge version
  constructor(log, config, api) {
    this.Accessory = Accessory;
    this.PlatformAccessory = PlatformAccessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    //define
    this.udpScoket = null;
    this.log = log;
    this.config = config;
    //init properties
    this.gateways = {};
    this.accessories = {};
    this.devices = {};
    //supported devices
    this._devices = {};
    //init upd server
    this.initUpdSocket();
    //init config
    this.initConfig(config);
    //init device parsers
    this.loadDevices();
    if (api) {
      // Save the API object as plugin needs to register new accessory via this object.
      this.api = api;
      // Listen to event "didFinishLaunching", this means homebridge already finished loading cached accessories
      // Platform Plugin should only register new accessory that doesn't exist in homebridge after this event.
      // Or start discover new accessories
      this.api.on('didFinishLaunching', this.didFinishLaunching);
    } else {
      this.log.error("Homebridge's version is too old, please upgrade!");
    }
  }
  /**
   * static method to export hap properties
   * @param {*homebridge} homebridge 
   */
  static init(homebridge) {
    //export some properties from homebridge
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    return new Promise((resolve, reject) => {
      homebridge.registerPlatform("homebridge-smarthome", "smarthome", Mijia, true);
      resolve();
    });
  }
  /**
   * init properties from config.json
   */
  initConfig(config) {
    let { mijia } = config;
    let { sids, passwords, devices } = mijia;
    if (sids && passwords) {
      if (sids.length != passwords.length) {
        throw new Error('sids length and passwords length must be equal');
      }
    }
    sids.map((sid, index) => {
      this.gateways[sid] = { password: passwords[index], devices: {} };
    });
    if (devices && devices.length > 0) { //for wifi devices
      devices.map((device) => {
        this.devices[device.name] = device;
      });
    }
  }
  /**
   * init udpScoket
   */
  initUpdSocket() {
    this.udpScoket = dgram.createSocket({
      type: 'udp4',
      reuseAddr: true
    });
    this.udpScoket.on('message', (msg, rinfo) => {
      this.log.debug('mijia udp socket receive -> %s', new String(msg));
      this.parseMsg(msg, rinfo);
    });
    this.udpScoket.on('error', (err) => {
      this.log.error('error, msg -> %s, stack -> %s', err.message, err.stack);
    });
    this.udpScoket.on('listening', () => {
      this.log.debug("Mijia upd server is listening on port 9898");
      udpScoket.addMembership(multicastIp);
      this.log.debug("Mijia add multicast to %s", multicastIp);
    });
    this.udpScoket.bind(serverPort);
  }

  /**
   * init parsers
   */
  loadDevices() {
    this._devices = require('./devices')(this);
  }

  didFinishLaunching() {
    //1.discover who are mijia gateway
    let cmd_whois = { 'cmd': 'whois' };
    this.sendMsg(cmd_whois, multicastIp, multicastPort);
    //2.set interval to update mijia gateway and check the gateway alive
    setInterval(() => {
      this.sendMsg(cmd_whois, multicastIp, multicastPort);
    }, 1800000); //1800s->30m
  }


  configureAccessory(accessory) {
    accessory.reachable = true;
    accessory.on('identify', (paired, callback) => {
      this.log.debug(accessory.displayName + " -> Identify!!!");
      callback();
    });
  }


  discoverZigbeeDevice(ip, port) {
    let cmd_get_id_list = { cmd: 'get_id_list' };
    this.sendMsg(cmd_get_id_list, ip, port);
  }

  /**
   * send data via upd socket
   * @param {*msg} msg 
   * @param {*ip} ip 
   * @param {*port} port 
   */
  sendMsg(msg, ip, port) {
    if (typeof msg == 'string') {
      this.udpScoket.send(msg, 0, msg.length, ip, port);
    } else {
      let str = JSON.stringify(msg);
      this.udpScoket.send(str, 0, str.length, ip, port);
    }
  }
  /**
   * parse msg from udp socket
   * @param {*msg} msg 
   * @param {*remoteaddr} rinfo 
   */
  parseMsg(msg, rinfo) {
    let json;
    try {
      json = JSON.parse(msg);
    } catch (ex) {
      this.log.error('parse json msg failed -> %s', ex);
      return;
    }
    let cmd = json.cmd;
    switch (cmd) {
      case 'iam': {
        let { ip, port, model } = json;
        if (model == 'gateway') {
          this.discoverZigbeeDevice(ip, port);
        } else {
          this.log.warn('receive a iam cmd,but model is %s', model);
        }
        break;
      }
      case 'get_id_list_ack': {
        let { sid, token } = json;
        let data = JSON.parse(json.data);
        let gateway = this.gateways[sid] ? this.geteways[sid] : { sid: sid };

        gateway.ip = rinfo.address;
        gateway.port = rinfo.port;
        gateway.token = token;
        gateway.last_time = new Date();

        let cmd_read = { cmd: 'read', sid: sid };
        this.sendMsg(cmd_read, gateway.ip, gateway.port);
        data.map((did, index) => {
          if (!this.devices[did]) {
            this.devices[did] = { sid: did, type: 'zigbee' };
          }
          this.devices[did].gateway = gateway;
          this.devices[did].last_time = new Date();
          gateway.devices[did] = this.devices[did];
          cmd_read.sid = did;
          this.sendMsg(cmd_read, gateway.ip, gateway.port);
        });
      }
      case 'heartbeat': {
        let { sid, model, short_id, token } = json;
        let data = JSON.parse(json.data);
        if (model == 'gateway') {
          this.gateways[sid].model = 'gateway';
          this.gateways[sid].short_id = short_id;
          this.geteways[sid].token = token;
          this.geteways[sid].last_time = new Date();
        } else {
          let device = this.devices[sid] ? this.devices : { sid: sid, short_id: short_id, type: 'zigbee' };
          device = Object.assign(device, data);
          device.last_time = new Date();
          this.devices[sid] = device;
        }
        break;
      }
      case 'write_ack':
      case 'read_ack':
      case 'report': {
        parseDevice(json, rinfo);
        break;
      }
      default: {
        this.log.warn('unkonwn cmd:[%s] from getway[%s]', cmd, (rinfo.address + ':' + rinfo.port));
      }
    }
  }

  parseDevice(json, rinfo) {
    //when the device status changed , will recive data
    let { sid, model, short_id, token } = json;
    let data = JSON.parse(json.data);
    if (model == 'gateway') {
      this.gateways[sid].short_id = short_id;
      this.geteways[sid].token = token;
      this.geteways[sid].last_time = new Date();
    } else {
      let device = this.devices[sid] ? this.devices : { sid: sid, short_id: short_id, model: model };
      device = Object.assign(device, data);
      this.devices[sid] = device;
    }
    if (this._devices[model]) {
      this._devices[model].parseMsg(json, rinfo);
    } else {
      this.log.warn('receive report cmd, but no support device found->%s', model);
    }
  }
}
//module exports define
module.exports = (homebridge) => {
  //init mikit
  return Mijia.init(homebridge);
}