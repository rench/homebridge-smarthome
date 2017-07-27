const router = require('koa-router')()
const overview = require('./overview')
const device = require('./device')
const user = require('./user')
const wifi = require('./wifi')
const scene = require('./scene')

router.use('/', overview.routes(), overview.allowedMethods())
router.use('/device', device.routes(), device.allowedMethods())
router.use('/user', user.routes(), user.allowedMethods())
router.use('/wifi', wifi.routes(), wifi.allowedMethods())
router.use('/scene', scene.routes(), scene.allowedMethods())

module.exports = router;