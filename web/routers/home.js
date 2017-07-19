const router = require('koa-router')();

module.exports = router.get('/', ctx => {
  ctx.body = 'home';
});