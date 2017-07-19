/**
 * this app.js is web server to manage your mijia's accessory
 */
const winston = require('winston');
const path = require('path');
const Koa = require('koa');
const convert = require('koa-convert');
const views = require('koa-views');
const koaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const koaLogger = require('koa-logger');
const session = require('koa-session-minimal');
const routers = require('./routers/')
const app = new Koa();
let _homebridge;

class WebApp {
  constructor(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.start();
  }
  /**
   * start app
   */
  start() {
    if (this.config == undefined) {
      this.log.error('webapp config is missing');
      return;
    }
    let { web } = this.config;
    app.use(session({
      key: 'smarthome-web'
    }));
    app.use(koaLogger());
    app.use(bodyParser());
    app.use(koaStatic(path.join(__dirname, './static')));
    app.use(views(path.join(__dirname, './views'), { extension: 'ejs' }));
    app.use(routers.routes()).use(routers.allowedMethods());
    app.listen(web.port);
  }
  /**
   * static method to export hap properties
   * @param {*homebridge} homebridge 
   */
  static init(homebridge) {
    return new Promise((resolve, reject) => {
      homebridge.registerPlatform("homebridge-smarthome", "smarthome-web", WebApp, true);
      resolve();
    });
  }
}


module.exports = (homebridge) => {
  _homebridge = homebridge;
  return WebApp.init(homebridge);
}