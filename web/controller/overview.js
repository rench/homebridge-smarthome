const _ = {};
_.home = async ctx => {
  ctx.body = '系统概况';
};
_.status = async ctx => {
  ctx.body = '系统概况';
  ctx.session = {
    user: 'lowang',
    time: new Date().valueOf()
  }
};
_.devices = async ctx => {
  ctx.body = '设备列表';
};
_.log = async ctx => {
  ctx.body = '系统日志';
}
module.exports = _;