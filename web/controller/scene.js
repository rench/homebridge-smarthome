//smart scene controller
const _ = {};
_.list = async ctx => {
  ctx.body = '场景管理';
};
_.add = async ctx => {
  ctx.body = '添加场景';
};
_.delete = async ctx => {
  ctx.body = '删除场景';
};
_.update = async ctx => {
  ctx.body = '修改场景';
}
module.exports = _;