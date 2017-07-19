const router = require('koa-router')();
const home = require('./home');
const api = require('./api');
const admin = require('./admin');

router.use('/', home.routes(), home.allowedMethods());
router.use('/api', api.routes(), api.allowedMethods());
router.use('/admin', admin.routes(), admin.allowedMethods());
module.exports = router;