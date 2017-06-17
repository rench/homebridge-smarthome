const mijia = require('./mijia');
const broadlink = require('./broadlink');
//module exports define
module.exports = {
  mijia: (homebridge) => {
    return mijia(homebridge);
  },
  broadlink: (homebridge) => {
    return broadlink(homebridge);
  }
}