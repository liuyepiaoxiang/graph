/**
 * Created by Administrator on 2017/5/17 0017.
 */
/**
 * 专门处理neo4j图数据库的原始数据
 * @param {Array} data
 * @return {Object} 返回值中的node,link分别表示处理过后的节点和连线数组
 * */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
// TODO: 根据后端修改的数据结构进行调整，相应调用此接口的数据也需要调整 20170808
function dataTransform(data) {
  console.log('dataTransform', data);
  const originData = Array.from(data.body.results[0].data, x => x.graph); // 最初的数据
  const originNodes = Array.from(originData, x => x.nodes); // 节点数组，需要去重合并
  const originLinks = Array.from(originData, x => x.relationships); // 连线数组，需要去重合并
  const nodesMap = new Map(); // 去重用的map数据结构
  const linksMap = new Map(); // 去重用的map数据结构
  const linksSet = new Set(); // 去重的set结构，根据link的id去重用

  /* eslint no-param-reassign: ["error", { "props": false }] */
  /**
   * 对节点数据进行处理函数
   * @param {Object} n
   * */
  function beforeSetNodes(n) {
    n.expand = false;
    n.isGroup = false;
    return n;
  }
  /**
   * 对连线数据进行处理函数
   * @param {Object} l
   * */
  function beforeSetLinks(l) {
    l.source = nodesMap.get(l.startNode);
    l.target = nodesMap.get(l.endNode);
    return l;
  }

  // console.log(originNodes);
  originNodes.forEach((e) => {
    e.forEach((n) => {
      // 该出可以对每个节点数据m进行属性添加和修改等操作
      beforeSetNodes(n);
      nodesMap.set(n.id, n);
    });
  });
  originLinks.forEach((e) => {
    e.forEach((l) => {
      /**
       * 将从A到B和从B到A的节点【统一】起来，保证这两种关心能被存到同一个数组中，用属性noadA加以判断
       * */
      let nodeA = l.startNode;
      let nodeB = l.endNode;
      if (nodeA > nodeB) {
        nodeA = l.endNode;
        nodeB = l.startNode;
      }
      l.nodeA = nodeA;
      // 该出可以对每个连线数据m进行属性添加和修改等操作
      beforeSetLinks(l);
      /**
       * 把相同节点之间的关系分类存放到同一个数组中，再用map包装起来
       * */
      if (linksMap.has(`${nodeA}-${nodeB}`)) {
        if (!linksSet.has(l.id)) {
          linksSet.add(l.id);
          linksMap.get(`${nodeA}-${nodeB}`).push(l);
        }
        // linksMap.set(`${nodeA}-${nodeB}`, linksMap.get(`${nodeA}-${nodeB}`).push(l));
      } else {
        linksSet.add(l.id);
        linksMap.set(`${nodeA}-${nodeB}`, [l]);
      }
    });
  });
  /**
   * 遍历linkMap，添加生成弧线path需要的参数
   * */
  // console.log('linksMap.values()', linksMap.values());
  const linkArr = [];
  [...linksMap.values()].forEach((z, i) => {
    z.forEach((y, l) => {
      y.pathCount = z.length; // 用来在生成弧线时计算中间采用直线画法的link是哪一条
      y.pathIndex = l; // 用来在生成弧线时判断该link是第几条link
      linkArr.push(y);
    });
  });
  // console.log('linkArr', linkArr);
  // console.log(nodesMap.entries(), linksMap.entries());

  return {
    node: [...nodesMap.values()],
    link: linkArr,
  };
}
export default dataTransform;
