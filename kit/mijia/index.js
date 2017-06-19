const Gateway = require('./gateway');
const Humidity = require('./humidity');
const Temperature = require('./temperature');
const Contact = require('./contact');
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
  return devices;
};