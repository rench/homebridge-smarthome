const router = require('koa-router')();
const user = require('../controller/user');

router.get('/', user.list);
router.post('/', user.add);
router.delete('/', user.delete);
router.put('/', user.update);

module.exports = router;