/**
 * this app.js is web server to manage your mijia's accessory
 */
const winston = require('winston');

class WebApp {
  constructor() {
    winston.info('webapp start')
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
  const app = new WebApp();
  app.init();
}