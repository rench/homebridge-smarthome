/**
 * this is smarthome entry point
 */

const web = require('./web');
const { mijia, broadlink } = require('./kit');
const winston = require('winston');

module.exports = homebridge => {
  //every kit will store their devices on ctx;
  homebridge.ctx = {};
  //init mijia devices
  mijia(homebridge).then(() => {
    //init broadlink devices
    broadlink(homebridge);
    //init web server
    web(homebridge);
  }).catch((msg) => {
    winston.error('homebridge init failed -> %s', msg);
  });
}
