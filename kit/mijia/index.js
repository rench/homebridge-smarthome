const Gateway = require('./gateway');
const Humidity = require('./humidity');
const Temperature = require('./temperature');
const Magnet = require('./magnet');
const Monitor = require('./monitor');
const Switch = require('./switch');
const Plug = require('./plug');
const CtrlLN1 = require('./ctrlln1');
const CtrlLN2 = require('./ctrlln2');
const CtrlNeutral1 = require('./ctrlneutral1');
const CtrlNeutral2 = require('./ctrlneutral2');
const SW861 = require('./sw861');
const SW862 = require('./sw862');
const Plug86 = require('./plug86');
const Natgas = require('./natgas');
const Smoke = require('./smoke');
const Curtain = require('./curtain');
//wifi device
const AirPurifier = require('./airpurifier');
module.exports = (mijia) => {
  let devices = {};
  devices.gateway = new Gateway(mijia);
  let humidity = new Humidity(mijia);
  let temperature = new Temperature(mijia);
  devices.sensor_ht = {
    parseMsg: (json, rinfo) => {
      humidity.parseMsg(json, rinfo);
      temperature.parseMsg(json, rinfo);
    }
  };
  devices.magnet = new Magnet(mijia);
  devices.motion = new Monitor(mijia);
  devices.switch = new Switch(mijia);
  devices.plug = new Plug(mijia);
  devices.ctrl_neutral1 = new CtrlNeutral1(mijia);
  devices.ctrl_neutral2 = new CtrlNeutral2(mijia);
  devices.ctrl_ln1 = new CtrlLN1(mijia);
  devices.ctrl_ln2 = new CtrlLN2(mijia);
  devices['86sw1'] = new SW861(mijia);
  devices['86sw2'] = new SW862(mijia);
  devices['86plug'] = new Plug86(mijia);
  devices.natgas = new Natgas(mijia);
  devices.smoke = new Smoke(mijia);
  devices.curtain = new Curtain(mijia);
  // wifi device
  devices['air-purifier'] = (mijia, config) => {
    new AirPurifier(mijia, config);
  };
  return devices;
};