const router = require('koa-router')();
const wifi = require('../controller/wifi');

router.get('/', wifi.list);
router.post('/', wifi.add);
router.delete('/', wifi.delete);
router.put('/', wifi.update);

module.exports = router;