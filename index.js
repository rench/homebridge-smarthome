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
  mijia(homebridge);
  //init broadlink devices
  broadlink(homebridge);
  //init web server
  web(homebridge);
}
