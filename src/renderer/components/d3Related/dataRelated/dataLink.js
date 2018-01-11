/**
 * Created by Administrator on 2017/6/1 0001.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars */
import { timelineSelected, timelineClear } from '../forceSimulation/createForceSimulation';

/**
 * 数据联动操作中，根据选择的type筛选其余的数据
 * @param {Array} arr 选中的数据的type组成的数组
 * */
function updateData(arr) {
  // console.log('updateData', arr);
  if (arr.length !== 0) {
    const set = new Set();
    arr.forEach((d) => {
      set.add(d.id);
    });
    timelineSelected(set);
  } else {
    timelineClear();
  }
}

export default updateData;
