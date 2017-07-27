const winston = require('winston');
const path = require('path');
const Koa = require('koa');
const convert = require('koa-convert');
const views = require('koa-views');
const koaStatic = require('koa-static');
const bodyParser = require('koa-bodyparser');
const koaLogger = require('koa-logger');
const session = require('koa-session-minimal');
const routers = require('./routers/');
const app = new Koa();

let web = {
  port: 8988
};

app.use(session({
  key: 'smarthome.sid'
}));
app.use(koaLogger());
app.use(bodyParser());
app.use(koaStatic(path.join(__dirname, './static')));
app.use(views(path.join(__dirname, './views'), { extension: 'ejs' }));
app.use(routers.routes()).use(routers.allowedMethods());
app.listen(web.port);
winston.info('webapp start at ' + web.port);