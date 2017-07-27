//smart device controller
const _ = {};
_.list = async ctx => {
  ctx.body = '设备管理';
};
_.add = async ctx => {
  ctx.body = '添加设备';
};
_.delete = async ctx => {
  ctx.body = '删除设备';
};
_.update = async ctx => {
  ctx.body = '修改设备';
}
module.exports = _;