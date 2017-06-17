const winston = require('winston');

class Broadlink {
  constructor() {
    winston.info('broadlink start')
  }
  init() {
    this.bind();
    this.start();
  }
  bind() {
    
  }
  start() {

  }
}


module.exports = () => {
  const broadlink = new Broadlink();
  broadlink.init();
}