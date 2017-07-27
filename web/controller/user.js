//smarthome user controller
const _ = {};
_.list = async ctx => {
  ctx.body = '用户管理';
};
_.add = async ctx => {
  ctx.body = '添加用户';
};
_.delete = async ctx => {
  ctx.body = '删除用户';
};
_.update = async ctx => {
  ctx.body = '修改用户';
}
module.exports = _;