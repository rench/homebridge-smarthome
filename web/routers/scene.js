const router = require('koa-router')();
const scene = require('../controller/scene');

router.get('/', scene.list);
router.post('/', scene.add);
router.delete('/', scene.delete);
router.put('/', scene.update);

module.exports = router;