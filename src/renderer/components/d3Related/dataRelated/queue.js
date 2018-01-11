/**
 * Created by Administrator on 2017/12/1 0001.
 */
/**
 * [Queue]
 * @param {[Int]} size [队列大小]
 * 该队列首为最新的元素，队列尾为最老的元素
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
function Queue(size) {
  const list = [];
  // 向队列中添加数据
  this.push = (data) => {
    if (data === null) {
      return false;
    }
    // 如果传递了size参数就设置了队列的大小
    if (size !== null && !isNaN(size)) {
      if (list.length === size) {
        this.pop();
      }
    }
    list.unshift(data);
    return true;
  };
  // 从队列中取出数据
  this.pop = () => list.pop();
  // 返回队列的大小
  this.size = () => list.length;
  // 返回队列的内容
  this.quere = () => list;
  // 返回队列的某一项
  this.back = () => list.shift();
}

export default Queue;
