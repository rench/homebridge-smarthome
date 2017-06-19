const Gateway = require('./gateway');
const Humidity = require('./humidity');
const Temperature = require('./temperature');
const Contact = require('./contact');
const Monitor = require('./monitor');
const Switch = require('./switch');
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
  devices.magnet = new Contact(mijia);
  devices.monitor = new Monitor(mijia);
  devices.switch = new Switch(mijia);
  return devices;
};