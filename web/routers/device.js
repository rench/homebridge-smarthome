const router = require('koa-router')();
const device = require('../controller/device');

router.get('/', device.list);
router.post('/', device.add);
router.delete('/', device.delete);
router.put('/', device.update);

module.exports = router;