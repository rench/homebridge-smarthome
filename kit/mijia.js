var PlatformAccessory, Accessory, Service, Characteristic, UUIDGen, CommunityTypes;
var _homebridge;

const miio = require('miio');
const dgram = require('dgram');
const util = require('util');
const inherits = require('util').inherits;
const crypto = require('crypto');
const devices = require('./mijia/');
const types = require('../util/types');
const iv = Buffer.from([0x17, 0x99, 0x6d, 0x09, 0x3d, 0x28, 0xdd, 0xb3, 0xba, 0x69, 0x5a, 0x2e, 0x6f, 0x58, 0x56, 0x2e]);
const multicastIp = '224.0.0.50';
const multicastPort = 4321;
const udpPort = 9898;


class Mijia {
  // config may be null
  // api may be null if launched from old homebridge version
  constructor(log, config, api) {
    this.PlatformAccessory = PlatformAccessory;
    this.Accessory = Accessory;
    this.Service = Service;
    this.Characteristic = Characteristic;
    this.UUIDGen = UUIDGen;
    this.CommunityTypes = CommunityTypes;
    //define
    this.udpScoket = null;
    this.log = log;
    this.config = config;
    //init properties
    this.gateways = {};
    this.accessories = {};
    //device object
    this.devices = {};
    //supported device parser
    this._devices = {};
    if (api) {
      // Save the API object as plugin needs to register new accessory via this object.
      this.api = api;
    } else {
      this.log.error("Homebridge's version is too old, please upgrade!");
    }
    //init upd server
    this.initUpdSocket().then(() => {
      //init config
      this.initConfig(config);
      //init device parsers
      this.loadDevices();
      //discover wifi device
      this.discoverWifiDevice();
    }).catch((err) => {
      this.log.error('mijia init upd socket error->%s', err);
    });
    if (this.api) {
      this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
    }
    if (_homebridge.mijia != undefined) {
      _homebridge.mijia = this;
    }
    this.log.debug('mijia constructor done');
  }
  /**
   * static method to export hap properties
   * @param {*homebridge} homebridge 
   */
  static init(homebridge) {
    return new Promise((resolve, reject) => {
      homebridge.registerPlatform("homebridge-smarthome", "smarthome-mijia", Mijia, true);
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
        if (device.sid != undefined) {
          this.devices[device.sid] = device;
        } else if (device.name != undefined) {
          this.devices[device.name] = device;
        } else {
          this.log.warn('device do not have sid or name,will discard to register');
        }
      });
    }
    this.log.debug('initConfig done');
  }
  /**
   * init udpScoket
   */
  initUpdSocket() {
    return new Promise((resolve, reject) => {
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
        reject(error);
      });
      this.udpScoket.on('listening', () => {
        this.log.debug("mijia upd server is listening on port 9898");
        this.udpScoket.addMembership(multicastIp);
        this.log.debug("mijia add multicast to %s", multicastIp);
        resolve();
      });
      this.udpScoket.bind(udpPort);
    });
  }

  /**
   * init parsers
   */
  loadDevices() {
    this._devices = devices(this);
    this.log.debug('loadDevices done');
  }

  didFinishLaunching() {
    //1.discover who are mijia gateway
    let cmd_whois = { cmd: 'whois' };
    this.sendMsg(cmd_whois, multicastIp, multicastPort);
    //2.set interval to update mijia gateway and check the gateway alive
    setInterval(() => {
      this.sendMsg(cmd_whois, multicastIp, multicastPort);
    }, 1800000); //1800s->30m
  }

  /**
   * configure cached accessory
   * @param {*} accessory 
   */
  configureAccessory(accessory) {
    accessory.reachable = true;
    accessory.on('identify', (paired, callback) => {
      this.log.debug(accessory.displayName + " -> Identify!!!");
      callback();
    });
    if (!this.accessories[accessory.UUID]) {
      this.accessories[accessory.UUID] = accessory;
    }
  }

  /**
 * discover wifi deivce 
 */
  discoverWifiDevice() {
    for (let key in this.devices) {
      let device = this.devices[key];
      let { type, model } = device;
      if (type == 'wifi') {
        if (this._devices[model]) {
          this._devices[model](this, device);
          this.log.debug('construct wifi device->%s', util.inspect(device));
        } else {
          this.log.warn('not support device->%s', util.inspect(device));
        }
      }
    }
    this.log.debug('discoverWifiDevice done');
  }
  /**
   * discover zigbee deivce via gateway
   * @param {*gateway ip} ip 
   * @param {*gateway port} port 
   */
  discoverZigbeeDevice(ip, port) {
    let cmd_get_id_list = { cmd: 'get_id_list' };
    this.sendMsg(cmd_get_id_list, ip, port);
    setInterval(() => {
      this.sendMsg(cmd_get_id_list, ip, port);
    }, 300000); //300s->5m
  }

  /**
   * send data via upd socket
   * @param {*msg} msg 
   * @param {*ip} ip 
   * @param {*port} port 
   */
  sendMsg(msg, ip, port) {
    this.log.debug('send msg->%s', util.inspect(msg));
    if (typeof msg == 'string') {
      this.udpScoket.send(msg, 0, msg.length, port, ip);
    } else {
      let str = JSON.stringify(msg);
      this.udpScoket.send(str, 0, str.length, port, ip);
    }
  }

  /**
 * send data via upd socket
 * @param {*msg} msg 
 * @param {*sid} sid
 */
  sendMsgToSid(msg, sid) {
    this.log.debug('send msg->%s', util.inspect(msg));
    let gateway = this.devices[sid];
    if (!gateway) {
      gateway = this.gateways[sid];
    } else {
      gateway = gateway.gateway;
    }
    if (!gateway) {
      this.log.error(`can't find gateway sid->${sid}`);
      return;
    }
    let { ip, port } = gateway;
    if (typeof msg == 'string') {
      this.udpScoket.send(msg, 0, msg.length, port, ip);
    } else {
      let str = JSON.stringify(msg);
      this.udpScoket.send(str, 0, str.length, port, ip);
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
        let gateway = this.gateways[sid] ? this.gateways[sid] : { sid: sid, model: 'gateway', token: token, devices:{} };

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
        break;
      }
      case 'heartbeat': {
        let { sid, model, short_id, token } = json;
        let data = JSON.parse(json.data);
        if (model == 'gateway') {
          let gateway = this.gateways[sid] ? this.gateways[sid] : { sid: sid };
          this.gateways[sid] = gateway;
          this.gateways[sid].model = 'gateway';
          this.gateways[sid].short_id = short_id;
          this.gateways[sid].token = token;
          this.gateways[sid].last_time = new Date();
        } else {
          let device = this.devices[sid] ? this.devices[sid] : { sid: sid, short_id: short_id, type: 'zigbee' };
          device = Object.assign(device, data);
          device.last_time = new Date();
          this.devices[sid] = device;
        }
        break;
      }
      case 'write_ack': {
        this.log.debug('write_ack ->%s', util.inspect(json));
        break;
      }
      case 'read_ack':
      case 'report': {
        this.parseDevice(json, rinfo);
        break;
      }
      default: {
        this.log.warn('unkonwn cmd:[%s] from getway[%s]', cmd, (rinfo.address + ':' + rinfo.port));
      }
    }
  }
  /**
   * parse zigbee devices msg
   * @param {*gateway json msg} json 
   * @param {*remote info} rinfo 
   */
  parseDevice(json, rinfo) {
    //when the device status changed , will recive data
    let { sid, model, short_id, token } = json;
    let data = JSON.parse(json.data);
    if (model == 'gateway') {
      if (short_id) {
        this.gateways[sid].short_id = short_id;
      }
      if (token) {
        this.gateways[sid].token = token;
      }
      this.gateways[sid].last_time = new Date();
    } else {
      let device = this.devices[sid] ? this.devices[sid] : { sid: sid, short_id: short_id, model: model };
      device = Object.assign(device, data);
      device.last_time = new Date();
      this.devices[sid] = device;
    }
    if (this._devices[model]) {
      this._devices[model].parseMsg(json, rinfo);
    } else {
      this.log.warn('receive report cmd, but no support device found->%s', model);
    }
  }
  /**
   * generate gateway write Key
   * @param {*gateway id} sid 
   */
  generateKey(sid) {
    let gateway = this.devices[sid];
    if (!gateway) {
      gateway = this.gateways[sid];
    } else {
      gateway = gateway.gateway;
    }
    if (!gateway) {
      this.log.error(`can't find gateway sid->${sid}`);
      return;
    }
    let { password, token } = gateway;
    let cipher = crypto.createCipheriv('aes-128-cbc', password, iv);
    let key = cipher.update(token, "ascii", "hex");
    cipher.final('hex');
    return key;
  }
}
//module exports define
module.exports = (homebridge) => {
  //export some properties from homebridge
  PlatformAccessory = homebridge.platformAccessory;
  Accessory = homebridge.hap.Accessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  CommunityTypes = types(homebridge);
  _homebridge = homebridge;
  //init mikit
  return Mijia.init(homebridge);
}