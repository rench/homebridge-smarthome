const Gateway = require('./gateway');
module.exports = (mijia) => {
  let devices = {};
  devices.gateway = new Gateway(mijia);
  return devices;
};