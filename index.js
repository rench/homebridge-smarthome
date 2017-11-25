/**
 * this is smarthome entry point
 */

const web = require('./web');
const { mijia, broadlink } = require('./kit');
const winston = require('winston');

module.exports = homebridge => {
  //every kit will store their devices on context;
  homebridge.context = {};
  //init mijia devices
  mijia(homebridge).catch(error => {
    this.log.error('mijia error->%s', err);
  });
  //init broadlink devices
  broadlink(homebridge).catch(error => {
    this.log.error('broadlink error->%s', err);
  });
  //init web server
  web(homebridge);
}
