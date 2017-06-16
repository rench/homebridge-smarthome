const gateway = require('./gateway');
module.exports = (mijia) => {
  let devices = {};
  devices.gateway = new gateway(mijia);
  return devices;
};