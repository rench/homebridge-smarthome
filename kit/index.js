const mijia = require('./mijia');
const broadlink = require('./broadlink');
//module exports define
module.exports = {
  mijia: (homebridge) => {
    mijia.init(homebridge);
  },
  broadlink: (homebridge) => {
    mijia.init(homebridge);
  }
}