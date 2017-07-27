const router = require('koa-router')();
const overview = require('../controller/overview');

router.get('/', overview.status);
router.get('/status', overview.status);
router.get('/devices', overview.devices);
router.get('/log', overview.log);
module.exports = router;