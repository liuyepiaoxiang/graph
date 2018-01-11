/**
 * Created by Administrator on 2017/5/10 0010.
 * 该文件为d3力导向图主文件，包含功能为：
 * 接收数据，根据数据生成力导向图
 * 接收数据，动态更新力导向图
 * 根据查询结果得到的数据，更新力导向图
 * 前期测试先将数据写死
 */
/* eslint-disable no-unreachable */

import * as d3 from 'd3'
import * as $ from 'jquery'
import { getArc, hidePie, showMessage } from '../Arc/ArcMenuGenerator'
import dataTransform from '../../d3Related/dataRelated/neo4jDataDealer'
import { getNodeIcon, getLinkColor } from '../../d3Related/dataRelated/otherDataDealer'
import { selectPath } from '../../d3Related/forceSimulation/linkPathGenerator'
import { http } from '../dataRelated/dataTransfer'
import setTimeline from '../timeLine/generateTimeline'
import timelineTransform from '../dataRelated/timelineDataDealer'

const nodes = [] // 力导向节点的数组，更新建议直接改动该项
const links = [] // 力导向连线的数组
let simulation // 力导向布局主体
let svg // svg容器
let g // svg内最大g元素用于zoom
let nodesContainer // 节点容器
let linksContainer // 连线容器
let nodeParts // 节点的update和enter部分
let linkParts // 连线的update和enter部分
let width // svg宽度
let height // svg高度
let currrentTransform = d3.zoomTransform(this) // 当前画布zoom量，在zoomend时更新
let brushStatus = false // 控制毛刷是否激活
let rescaleStatus = false // zoom重置flag；为true时zoomstart将会执行重置
let newXscale
let newYscale
const r = 25 // 节点半径
const nearstR = 30 // drag时获取附近节点的判定半径
const brushSelectedNodes = [] // 用来存放毛刷选取的节点的data
const clickedNodes = [] // 用来存放单击选取的节点的data,暂时使用的brushSelectedNodes，后期可能需要该变量
let groupCount = 1 // 记录节点组合的组数
let onceClickStatus = false // 记录单击节点选中
const checkData = []
const eventCount = [
  {
    name: '乘车事件',
    count: 0
  },
  {
    name: '交易事件',
    count: 0
  },
  {
    name: '通话事件',
    count: 0
  },
  {
    name: '住宿事件',
    count: 0
  }
] // 记录数据里面每种数据类型的对象
/**
 * 时间轴同步触发函数
 * TODO:LJ 下面初始化有问题，导致每次图形刷新都会让勾选至默认
 * */
function timelineUpdate () {
  if (nodes.length !== 0) {
    http.getRelation('/graph/timershaft', 'post', { id: Array.from(nodes, d => d.id) })
      .then((response) => {
        // console.log('getTimeline', response);
        // setTimeline(timelineTransform(response));
        setTimeline(timelineTransform(response))
      })
    http.getRelation('/graph/typeres', 'post', { id: Array.from(nodes, d => d.id) })
      .then((response) => {
        const checks = response.body
        checks.forEach((v, i) => {
          v.checked = true
        })
        checkData.splice(0, checkData.length)
        checkData.push(...response.body)
        /* $('#check').html('');
        let checksHtml = '<span>事件数据</span><ul>';
        checks.forEach((v, i) => {
          if (v.type !== undefined) {
            checksHtml += `<li style="list-style-type:none;"></li>`;
          }
        });
        checksHtml += '</ul>';
        $('#check').html(checksHtml); */
      })
  }
}

/**
 * 专门根据节点id删除连线数据的函数
 * @parap {String} id 指定的节点id
 * */
function delLinkById (id) {
  for (let i = links.length - 1; i >= 0; i -= 1) {
    if (links[i].startNode === id || links[i].endNode === id) {
      links.splice(i, 1)
    }
  }
}
/**
 * 对力导向连线数据内的对象引用重新赋值，保证图形展示正确
 * */
function reQuoteForceData () {
  links.forEach((l) => {
    l.source = nodes.find(n => n.id === l.startNode)
    l.target = nodes.find(n => n.id === l.endNode)
  })
}
function clickSVG () {
  // 隐藏二级菜单
  $('.pieContainer').fadeOut()
  // console.log('click svg');
  // 取消所有毛刷选中节点效果
  nodeParts.classed('brushSelected', false)
  // 取消多节点操作显示
  $('.topToolBox').hide()
  brushSelectedNodes.splice(0)
  // 隐藏环形菜单
  // d3.select('.pieContainer').classed('fade', true);
}
const color = d3.scaleOrdinal(d3.schemeCategory20)
/**
 * ********** ********** **********
 * 设定拖拽drag
 * d3.event.button用来过滤拖拽drag的行为
 * 0表示鼠标左键
 * 1表示滚轮案件
 * 2表示鼠标右键
 * */
const drag = d3.drag()
drag.filter(() => !d3.event.button)
/**
 * drag的subject
 * 利用该函数应该可以达到就近选择的效果
 * https://github.com/d3/d3-drag
 * */
function subjectFn () {
  const currentMouseX = (d3.mouse(this)[0] - currrentTransform.x) / currrentTransform.k
  const currentMouseY = (d3.mouse(this)[1] - currrentTransform.y) / currrentTransform.k
  const nearstNode = simulation.find(currentMouseX, currentMouseY, nearstR)
  if (nearstNode) {
    /* d3.selectAll('circle')
      .filter(d => d.id === nearstNode.id)
      .transition()
      .attr('r', 1.4 * r); */
    d3.selectAll('image')
      .filter(d => d.id === nearstNode.id)
      .transition()
      .attr('r', 1.4 * r)
  }
  return nearstNode
  // return d == null ? { x: d3.event.x, y: d3.event.y } : d;
}
function dragstarted () {
  // console.log('dragstarted', d3.event.subject);
  if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  d3.event.subject.fx = d3.event.subject.x
  d3.event.subject.fy = d3.event.subject.y

  // 拖动开始时就对环形菜单进行定位
  // d3.selectAll('.pieContainer').attr('transform', `translate(${d3.event.x}, ${d3.event.y})`);

  // 给开始拖拽节点添加特殊样式
  /* eslint-disable max-len */
  // nodeParts.selectAll('circle').filter(d => d.id === d3.event.subject.id).classed('dragActive', true);
  nodeParts.selectAll('image').filter(d => d.id === d3.event.subject.id).classed('dragActive', true)
  d3.event.subject.active = true
}

function dragged () {
  // console.log('dragged', d3.event.active);
  // 将拖动坐标更新到 拖动的subject坐标中
  d3.event.subject.fx = d3.event.x
  d3.event.subject.fy = d3.event.y

  d3.selectAll('.pieContainer').classed('pieDisable', true)
  // 拖动中对环形菜单进行定位
  // d3.selectAll('.pieContainer').attr('transform', `translate(${d3.event.x}, ${d3.event.y})`);
}

function dragended () {
  // console.log('drag ended');
  if (!d3.event.active) simulation.alphaTarget(0)
  // 结束后始拖拽节点取消特殊样式
  // nodeParts.filter(d => d.id === d3.event.subject.id).classed('dragActive', false);
  // nodeParts.selectAll('circle').classed('dragActive', false);
  nodeParts.selectAll('image').classed('dragActive', false)
  d3.event.subject.active = false
  // d3.event.subject.fx = null;
  // d3.event.subject.fy = null;
  // 拖拽时对环形菜单定位
  /* d3.selectAll('circle')
    .filter(d => d.id === d3.event.subject.id)
    .transition()
    .attr('r', r); */
}
/**
 * ********** ********** **********
 * 设定缩放平移zoom
 * method: zoomed 缩放时执行的主函数
 * method: rescale 还原缩放为初始大小
 * */
const zoom = d3.zoom()
const stepZoomIn = 1.4 // 单次放大比例
const stepZoomOut = 0.8 // 单次缩小比例
function zoomStart () {
  // console.log('zoom start');
}
function zooming () {
  // console.log(d3.zoomTransform(this).k);
  // g.attr('transform', d3.event.transform);
  g.attr('transform', `translate(${d3.zoomTransform(this).x},${d3.zoomTransform(this).y}) scale(${d3.zoomTransform(this).k})`)
}
function zoomEnd () {
  // console.log('zoom end', d3.zoomTransform(this));
  // 将当前zoom值存储到变量中保存
  currrentTransform = d3.zoomTransform(this)
}
function zoomIn () {
  // console.log('zoomIn');
  /* eslint-disable max-len */
  zoom.translateBy(svg.transition(), 0, 0)
  zoom.scaleBy(svg.transition(), stepZoomIn)
  // zoom.transform(svg.transition().duration(750), d3.zoomIdentity.translate(0 - currrentTransform.x, 0 - currrentTransform.y).scale(currrentTransform.k + stepZoomK));
}
function zoomOut () {
  zoom.translateBy(svg.transition(), 0, 0)
  zoom.scaleBy(svg.transition(), stepZoomOut)
  // console.log('zoomOut');
  // zoom.transform(svg.transition().duration(750), d3.zoomIdentity.translate(0 - currrentTransform.x, 0 - currrentTransform.y).scale(currrentTransform.k - stepZoomK));
}
/**
 * todo:unfinished yet
 * */
function rescale () {
  rescaleStatus = true
  zoom.transform(svg.transition().duration(750), d3.zoomIdentity.translate(0, 0).scale(1))
  // 将所有节点变为非固定状态
  nodes.forEach((d) => { d.fx = null; d.fy = null })
  simulation.alpha(0.5).restart()

  /* svg.transition().duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1)); */
  // g.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
}
function centerNode (source) {
  const t = d3.zoomTransform(svg)
  let x = -source.y
  let y = -source.x
  x = (x * t.k) + (width / 2)
  y = (y * t.k) + (height / 2)
  svg.transition().duration(750)
    .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(t.k))
}
/**
 * ********** ********** **********
 * 设定brush
 * */
const brush = d3.brush()
function brushFilter () {
  // return !d3.event.button;
  if (!d3.event.button) {
    return brushStatus
  }
  return false
}
function brushStart () {
  // console.log('brushStart');
  const extent = d3.event.selection
  if (extent !== null) {
    brushSelectedNodes.splice(0)
  }
  return true
}
// todo:缩放后的brush选取范围异常,currrentTransform.k还需要再换算
function brushed () {
  // console.log('brushed', d3.event.selection);
  const extent = d3.event.selection
  /* eslint-disable max-len */
  if (extent !== null) {
    nodeParts.classed('brushSelected', (d) => {
      const rua = extent[0][0] <= ((d.x + r) * currrentTransform.k) + currrentTransform.x && ((d.x - r) * currrentTransform.k) + currrentTransform.x < extent[1][0] + r && extent[0][1] <= ((d.y + r) * currrentTransform.k) + currrentTransform.y && ((d.y - r) * currrentTransform.k) + currrentTransform.y < extent[1][1] + r
      console.log(rua)
      return rua
    })
    // extent[0][0] <= ((d.x + r) * currrentTransform.k) + currrentTransform.x && ((d.x - r) * currrentTransform.k) + currrentTransform.x < extent[1][0] + r && extent[0][1] <= ((d.y + r) * currrentTransform.k) + currrentTransform.y && ((d.y - r) * currrentTransform.k) + currrentTransform.y < extent[1][1] + r,
  }
}
function brushEnd () {
  // console.log('brushEnd', d3.event.selection);
  const extent = d3.event.selection
  if (extent !== null) {
    // 借用d3选择集对数据d进行操作，实际上并不修改样式
    d3.selectAll('.brushSelected').classed('brushSelected', (d) => {
      brushSelectedNodes.push(d)
      return true
    })
    d3.selectAll('.brushSelected').select('image')
      .attr('xlink:href', d0 => getNodeIcon(d0.icon, true))
    // 取消框选
    // d3.select('.brush').call(brush.move, null);
    brush.move(svg.select('.brush'), null)
    // console.log(brushSelectedNodes);
  }
  // 根据框选的数据进行判断是否显示多节点操作菜单
  if (brushSelectedNodes.length > 1) {
    // console.log('选中了耶');
    $('.topToolBox').show()
  }
}

/**
 *@filename:createForceSimulation.js
 *@method:
 *@abstract:
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/8/4 0004
 *@version
 */
function checkNode () {
  console.log('asdc')
}
/**
 * forceCollide相关函数
 * */
function collideRadius (d) {
  // console.log(d);
  if (d.id === 'Alice') {
    return 430
  }
  return 40
}
const collideStrength = 0.2
/**
 * forceManyBody相关函数
 * 负数表示斥力，正数表示引力。绝对值越大力越大
 * */
function manyBodyStrength (d) {
  return -290
}
/**
 * forceLink相关函数
 * */
function linkDistance (d) {
  return 170
}
/**
 * 切换节点显示内容的函数，暂时写死
 * */
/* eslint-disable no-else-return */
function getTextKey (d) {
  const property = d.properties
  // const keyArr = Object.properties.keys(d);
  if (property['旅馆名称']) {
    return property['旅馆名称']
  } else if (property.CC) {
    return property.CC
  } else {
    return property[d.displayName] || property[Object.keys(property)[0]]
  }
}
/**
 * 节点相关函数
 * */
/**
 * 获取对应id节点的其余相关节点和连线数组
 * @param {String} id
 * @return {Object} relNodes, relLinks
 * */
function getRelated (id) {
  const relNodesSet = new Set()
  links.filter(d => d.startNode === id)
  links.filter(d => d.endNode === id)
  linksContainer.selectAll('path').filter((d) => {
    if (d.startNode === id) {
      relNodesSet.add(d.endNode)
    }
    if (d.endNode === id) {
      relNodesSet.add(d.startNode)
    }
    return (d.startNode === id) || (d.endNode === id)
  })
    .classed('relLink', true)
  nodesContainer.selectAll('image').filter(d => relNodesSet.has(d.id))
    .attr('xlink:href', d => getNodeIcon(d.icon, true))
}

function mouseoverNode (d) {
  $('#secondSpreadPie').addClass('dashOut')
  $('#secondAnalysisPie').addClass('dashOut')

  console.log(d3.selectAll('.linkEl'))
  getRelated(d.id)
  // 鼠标移上时切换图标
  d3.select(this)
    .attr('xlink:href', d0 => getNodeIcon(d0.icon, true))
}
function mouseoutNode () {
  // 鼠标移出时切换图标
  d3.select(this)
    .attr('xlink:href', d => getNodeIcon(d.icon))
  // 鼠标移出时去掉样式
  linksContainer.selectAll('path')
    .classed('relLink', false)
  nodesContainer.selectAll('image')
    .attr('xlink:href', d => getNodeIcon(d.icon, false))
}
function clickNode (d) {
  console.log('click node', d3.event.button, d, this)
  // 左键点击节点时隐藏环形菜单
  d3.selectAll('.pieContainer').classed('pieDisable', true)
  // 传递数据给面板内的详细信息
  showMessage(d)
  if (onceClickStatus) {
    d3.select(this.parentNode).classed('clicked', true)
    d3.selectAll('.clicked').select('image')
      .attr('xlink:href', d0 => getNodeIcon(d0.icon, true))
    brushSelectedNodes.push(d)
  }
}

/**
 *@filename:createForceSimulation.js
 *@method:
 *@abstract:
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/8/8 0008
 *@version
 */
function onceClick () {
  /*  eslint-disable no-use-before-define */
  brushStatus = true
  switchBrush()
  onceClickStatus = !onceClickStatus
}

function mousedownNode (d) {
  // console.log('mousedownNode', d3.event);
  // d3.dragDisable(window);
  d.fx = d.x
  d.fy = d.y
}
function mouseupNode (d) {
  console.log('mouseupNode', d)
  if (d3.event.button === 2) {
    // 如果是右键up，则请求菜单
    /* const curX = d3.select(this).attr('cx');
    const curY = d3.select(this).attr('cy'); */
    let R // 为了准确定位环形菜单位置
    if (d.isGroup) {
      R = 1.25 * r
    } else {
      R = r
    }
    const curX = Number(d3.select(this).attr('x')) + R
    const curY = Number(d3.select(this).attr('y')) + R
    console.log(curX)
    getArc(d, curX, curY)
  } else {
    // 如果是左键up， 则取消节点固定
    d.fx = null
    d.fy = null
  }
}
/**
 * 创建svg节点以及力导向图节点连线相应容器
 * */
function createLayout () {
  const containerBox = $('#svgContainer')
  width = containerBox.width()
  height = containerBox.height()
  svg = d3.select('#svgContainer')
    .append('svg')
    .attr('id', 'mainSVG')
    .attr('class', 'mainSVG')
    .attr('width', width)
    .attr('height', height)
    .on('click', clickSVG)
  /* svg
    .call(drag
      .subject(subjectFn)
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)); */
  svg
    .call(zoom
      .scaleExtent([1 / 8, 4])
      .on('start', zoomStart)
      .on('zoom', zooming)
      .on('end', zoomEnd))
    .on('dblclick.zoom', null)
  g = svg.append('g')
    .attr('class', 'mainG')
  /**
   * 下面函数移动到switchBrush函数内动态创建，不然会覆盖节点的click事件
   * */
  /* svg.append('g')
    .attr('class', 'brush')
    .call(brush
      .filter(brushFilter)
      .on('start', brushStart)
      .on('brush', brushed)
      .on('end', brushEnd)); */
  /**
   * 下方myLinks和myNodes的顺序将影响节点和连线的上下关系
   * */
  g.append('g')
    .attr('id', 'linksContainer')
  g.append('g')
    .attr('id', 'nodesContainer')
  nodesContainer = d3.select('#nodesContainer')
  linksContainer = d3.select('#linksContainer')
}

/**
 *@filename:createForceSimulation.js
 *@method: staticties
 *@abstract: 统计数据中有多少乘车数据、住宿数据和交易数据
 *@parma {Array} node
 *@return
 *@author:liujia
 *@time:2017/6/3 0003
 *@version
 */
function staticties (node) {
  // init: 初始化每个值
  let trailCount = 0
  let stayCount = 0
  let phoneCount = 0
  let tradeCount = 0
  node.forEach((v, i) => {
    if (v.properties.type) {
      switch (v.properties.type) {
        case '乘车事件':
          trailCount += 1
          break
        case '住宿事件':
          stayCount += 1
          break
        case '通话事件':
          phoneCount += 1
          break
        case '交易事件':
          tradeCount += 1
          break
        default:
          break
      }
    }
  })
  eventCount[0].count = trailCount
  eventCount[1].count = tradeCount
  eventCount[2].count = phoneCount
  eventCount[3].count = stayCount
}

/**
 * 更新力导向视图函数，直接会在内部使用到外部两个变量
 * 分别为 nodes和links，为节点和连线数据
 * */
function updateLayout () {
  // 重绘之前先对数据进行统计--by lj 20170603
  staticties(nodes)
  // 专门针对link中的引用重新赋值
  reQuoteForceData()

  // simulation.force('link', d3.forceLink(links).distance(linkDistance));
  // simulation.tick();
  /**
  * 圆弧绘制
   **/
  const arc = d3.arc()
    .innerRadius(r)
    .outerRadius(r + 5)
    .padAngle(0)
    .startAngle(0)
    .endAngle(Math.PI * 2)
  /**
   * 节点部分
   * */
    // 如果用d.id则多次请求同一数据后节点会无法选取移动
    // 如果用d.index则解除分组时会残留元素
  const updateNode = nodesContainer.selectAll('g').data(nodes, d => d.id + d.index)
  // console.log('updateNode', updateNode);
  // const enterParts = nodesContainer.enter().append('g');
  updateNode.exit()
    /* .transition()
    .attr('r', 0) */
    .remove()
  nodeParts = updateNode.enter().append('g')
  // .attr('id', d => d.id);
  nodeParts
    .append('image')
    .attr('xlink:href', d => getNodeIcon(d.icon))
    .attr('class', d => 'nodeEl')
    .attr('width', (d) => {
      if (d.isGroup) {
        return 2.5 * r
      }
      return 2 * r
    })
    .attr('height', (d) => {
      if (d.isGroup) {
        return 2.5 * r
      }
      return 2 * r
    })
    .attr('x', (d) => {
      if (!d.x) {
        return 0
      }
      return d.x - r
    })
    .attr('y', (d) => {
      if (!d.y) {
        return 0
      }
      return d.y - r
    })
    .on('mouseover', mouseoverNode)
    .on('mouseout', mouseoutNode)
    .on('mousedown', mousedownNode)
    .on('mouseup', mouseupNode)
    .on('click', clickNode)
    .call(drag
      // .subject(subjectFn)
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended))
  // console.log('nodeParts', nodeParts);

  /**
   * 节点环部分
   */
  /* nodeParts
    .append('path')
    .attr('class', d => 'nodeArcEl')
    .attr('id', d => `nodeText_${d.id}`)
    .attr('d', arc)
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .style('fill', (d, i) => color(i))
    .attr('transform', d => `translate(${d.x}, ${d.y})`); */
  /**
   * 节点文字部分
   * */
  // const updateText = nodesContainer.selectAll('g').data(nodes, d => d.index);
  // updateText.exit().remove();
  /* eslint-disable arrow-parens */
  nodeParts
    .append('text')
    .attr('class', 'nodeText')
    .attr('id', d => `nodeText_${d.id}`)
    .style('fill', d => {
      let nodecolor = '#333'
      if (d.properties.type) {
        nodecolor = '#912CEE'
      }
      return nodecolor
    })
    .attr('text-anchor', 'middle')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('dx', () => 0)
    .attr('font-size', '12px')
    .attr('dy', '3em')
    .text(getTextKey)
  nodeParts = nodeParts.merge(updateNode)

  /**
   * 连线部分
   * */
  const updateLink = linksContainer.selectAll('g').data(links, d => d.id + d.index)
  updateLink.exit().remove()
  linkParts = updateLink.enter().append('g')
  linkParts.append('path')
    // .attr('class', (d) => { console.log(d); return 'linkEl'; })
    // 此处可以不用创建实例
    /* .attr('d', (d) => {
      const arc = new StraightDraw({ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y });
      return arc.outline();
    }) */
    .attr('class', d => 'linkEl')
    .style('stroke', d => getLinkColor(d.target.icon))
    .style('stroke-width', (d) => {
      // 根据通话次数控制link粗细
      if (d.properties['次数']) {
        const counts = d.properties['次数']
        if (counts < 10) return '1'
        if (counts < 50) return '3'
        if (counts < 100) return '6'
        return '10'
      }
      return '1'
    })
    .style('fill', d => getLinkColor(d.target.icon))
  /**
   * 连线文字部分
   * */
  /* eslint-disable arrow-parens,no-else-return */
  linkParts
    .append('text')
    .attr('class', 'linkText')
    .attr('id', d => `linkText_${d.id}`)
    .style('fill', '#333')
    .attr('text-anchor', 'middle')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('dx', () => 0)
    .attr('font-size', '10px')
    .attr('dy', '3em')
    .text(d => {
      if (d.properties['次数']) {
        return `${d.type}：${d.properties['次数']}`
      } else if (d.properties.count) {
        return `${d.type}：${d.properties.count}`
      } else {
        return d.type
      }
    })
  linkParts = linkParts.merge(updateLink)
  // Update and restart the simulation.
  // simulation.nodes(nodes);
  simulation.nodes(nodes)
  simulation.force('link').links(links)
  simulation.alpha(1).restart()

  // timelineUpdate();
}

/**
 * 创建力导向布局并且设置tick函数及simulation和force相关
 * */
function createSimulation () {
  // console.log('createGraph');
  /**
   * tick部分
   * */
  /* eslint no-param-reassign: ["error", { "props": false }] */
  function ticked () {
    const k = 6 * simulation.alpha()
    /* nodeParts.selectAll('circle')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y); */
    nodesContainer.selectAll('image')
      .attr('x', d => d.x - r)
      .attr('y', d => d.y - r)
    linksContainer.selectAll('path')
      .each((d) => {
        return
        // Push sources up and targets down to form a weak tree.
        d.source.y -= k
        d.target.y += k
      })
      .attr('d', d => selectPath(d).outline(selectPath(d).textWidth(d)))
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
    nodesContainer.selectAll('text')
      .style('pointer-events', 'none')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
    linksContainer.selectAll('g')
      .attr('transform', (d) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360
        d.naturalAngle = d.target.id === d.startNode ? (angle + 180) % 360 : angle
        return `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle})`
      })
    // 给文字添加transform，达到左右旋转后文字自动改变方向的效果
    linksContainer.selectAll('text')
      .style('pointer-events', 'none')
      .attr('x', (d) => {
        const arc = selectPath(d)
        // console.log(arc.textWidth(d));
        return arc.textpos_x()
      })
      .attr('y', (d) => {
        // console.log(d.id);
        const arc = selectPath(d)
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360
        d.naturalAngle = d.target.id === d.startNode ? (angle + 180) % 360 : angle
        if (d.naturalAngle < 90 || d.naturalAngle > 270) {
          return arc.textpos_y()
          // return `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle})`;
        }
        return arc.textpos_y() - 60 // todo:要问我为啥-60，我也不知道···
      })
      .attr('transform', (d) => {
        // const arc = new StraightDraw({ x: d.source.x, y: d.source.y }, { x: d.target.x, y: d.target.y });
        const arc = selectPath(d)
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const angle = (((Math.atan2(dy, dx) / Math.PI) * 180) + 360) % 360
        d.naturalAngle = d.target.id === d.startNode ? (angle + 180) % 360 : angle
        if (d.naturalAngle < 90 || d.naturalAngle > 270) {
          return null
          // return `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle})`;
        }
        return `rotate(180 ${arc.textpos_x()} ${arc.textpos_y()})`
        // return 'rotate(180)';
        // return `translate(${d.source.x} ${d.source.y}) rotate(${d.naturalAngle})`;
      })
  }
  /**
   * 设定力模拟
   * */
  simulation = d3.forceSimulation(nodes)
  simulation
    .force('x', d3.forceX(width / 2).strength(0.05)) // 会影响出现的位置？
    .force('y', d3.forceY(height / 2).strength(0.05))
    .force('link', d3.forceLink(links).distance(linkDistance))
    .force('charge', d3.forceManyBody().strength(manyBodyStrength))
    .force('collide', d3.forceCollide(30))
    // .force('center', d3.forceCenter(width / 2, height / 2))
    // .force('collide', d3.forceCollide().radius(collideRadius).strength(collideStrength))
    .on('tick', ticked)
}
/**
 * 启动函数，接收数据并生成视图
 * @param { Array } mynodes 需要生成的力导向节点数据
 * @param { Array } mylinks 需要生成的力导向连线数据
 * @param {Boolean} clear 定义是否需要清空nodes和links
 * @return { Undefined }
 * */
function start (mynodes = nodes, mylinks = links, clear = true) {
  if (clear) {
    nodes.splice(0)
    links.splice(0)
  }
  nodes.push(...mynodes)
  links.push(...mylinks)

  // 如果没有则创建svg
  if (!$('#mainSVG').length) {
    createLayout()
    createSimulation()
  }
  // createLayout();
  hidePie()
  updateLayout()
}
/**
 * 数据修改函数
 * 修改nodes和links
 * @param {Array} newData 新的数据
 * @param {String} tar 指定对象，nodes或者links
 * @param {Boolean} isClear 指定方法，是否splice清空
 * */
function dealData (newData, tar, isClear) {
  switch (tar) {
    case 'nodes': {
      if (isClear) { nodes.splice(0) }
      nodes.push(...newData)
      break
    }
    case 'links': {
      if (isClear) { links.splice(0) }
      links.push(...newData)
      break
    }
    default: break
  }
  // return false;
}
/**
 * 扩展函数，不会清除视图中已经存在的数据，单纯的添加
 * @param {String} nodeID 扩展的节点的id
 * @param {String} arcName 扩展的节点的名称，用来控制扩展和收缩
 * @param {Object} response 通过调用接口得到的返回结果
 * */
function expandNode (nodeID, arcName, response) {
  // console.log('expandNode');
  // 以下为添加方法
  const thisNode = nodes.find(z => z.id === nodeID)
  const data = dataTransform(response) // 将数据经过特殊处理，得到返回结果
  const node = data.node
  const link = data.link

  // 下面三行达到切换而非添加效果
  /* nodes.copyWithin(thisNode.index, 0);
  nodes.splice(1);
  links.splice(0); */
  // console.log(link);
  node.forEach((e) => {
    // 如果if返回undefined说明该id节点不存在，则将新的push进去
    if (!nodes.find(z => z.id === e.id)) {
      nodes.push(e)
    }
  })
  link.forEach((e) => {
    if (!links.find(z => z.id === e.id)) {
      links.push(e)
    }
  })
  // nodes.push(...node);
  // links.push(...link);
  // console.log(nodes);
  // console.log(nodes, links);
  updateLayout()
}
/**
 * 删除数据函数，根据id删除节点以及相关连线 TODO:LJ写一个删除多个点的函数用于菜单关闭多个节点
 * @param {String} nodeID
 * */
function removeNode (nodeID) {
  // console.log('removeNode');
  hidePie()
  // find只能找出第一个，所以节点用find links不行
  nodes.find((val, ind, arr) => {
    if (val.id === nodeID) {
      arr.splice(ind, 1)
      return true
    }
    return false
  })
  // 根据startNode和endNode来删除连线
  delLinkById(nodeID)
  updateLayout()
}
/**
 * 删除多个框选节点函数
 * */
function removeNodes () {
  console.log('removeNodes')
  const nodesMap = new Map()
  // const linksMap = new Map();
  nodes.forEach((val) => { nodesMap.set(val.id, val) })
  brushSelectedNodes.forEach((val) => {
    if (nodesMap.has(val.id)) nodesMap.delete(val.id)
  })
  // links.forEach((val) => { linksMap.set(val.startNode, val); });
  brushSelectedNodes.forEach((val) => {
    delLinkById(val.id)
  })
  // console.log(links);
  start([...nodesMap.values()], [...links])
}
/**
 * 切换毛刷状态和平移状态
 * */
function switchBrush () {
  if (!brushStatus) {
    svg.append('g')
      .attr('class', 'brush')
      .call(brush
        .filter(brushFilter)
        .on('start', brushStart)
        .on('brush', brushed)
        .on('end', brushEnd))
  } else {
    d3.select('.brush').remove()
  }
  brushStatus = !brushStatus
  onceClickStatus = false

  // console.log(d3.select('.brush').classed('brushDisable'));
  // d3.select('.brush').classed('brushDisable', true);
}
/**
 * 切割函数，移除选中之外的节点和关系
 * */
function cut () {
  // console.log('cutcut');
  // 如果框选的节点不为空，则进行切割操作
  // TODO:1019不能只是纯粹的切割节点，还需要对关系进行处理
  if (brushSelectedNodes.length) {
    start(brushSelectedNodes)
  }
}

function getNodes () {
  return nodes
}
/**
 *@filename:createForceSimulation.js
 *@method:group
 *@abstract:对框选的节点进行判断，若为空，则没有任何操作；若不为空，则将所选的点进行赋予电荷数，互相吸引
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/5/24 0024
 *@version
 */
function makeGroup () {
  // console.log('gruop', brushSelectedNodes);
  if (brushSelectedNodes.length) {
    const idSet = new Set() // 用来记录框选中的节点id;
    const nodesMap = new Map()
    nodes.forEach((val) => { nodesMap.set(val.id, val) })
    brushSelectedNodes.forEach((val) => {
      idSet.add(val.id)
      if (nodesMap.has(val.id)) nodesMap.delete(val.id) // 将其它框选的节点从力导向map中删除
    })
    const groupNode = {
      expand: false,
      icon: 'nodesGroup',
      id: `group${groupCount}`,
      labels: [],
      properties: {},
      isGroup: true, // 用来判断该节点是否为组
      groupNodesData: [...brushSelectedNodes],
      groupLinksData: []
    }
    nodesMap.set(groupNode.id, groupNode) // 将新生成的大节点组添加到力导向map中
    // 更新连线到节点组
    links.forEach((l) => {
      if (idSet.has(l.endNode) || idSet.has(l.startNode)) {
        const link = {}
        Object.assign(link, l)
        groupNode.groupLinksData.push(link)
      }
      if (idSet.has(l.startNode)) {
        l.startNode = groupNode.id
      }
      if (idSet.has(l.endNode)) {
        l.endNode = groupNode.id
      }
    })
    nodes.splice(0)
    start([...nodesMap.values()], links, false)
    groupCount += 1
  }
  return true
}
/**
 * 解除分组功能函数
 * @param {}
 * */
function releaseGroup (group = brushSelectedNodes[0]) {
  console.log('releaseGroup', group)
  const delIndex = nodes.findIndex((value, index, arr) => value.id === group.id) // 获取大组节点的index
  nodes.splice(delIndex, 1) // 删除大组节点
  nodes.push(...group.groupNodesData) // 添加大组内的小节点
  delLinkById(group.id) // 删除跟大组相关的links
  links.push(...group.groupLinksData) // 添加组合前的的连线
  start(nodes, links, false) // 启动布局
}
/**
 * 与时间轴联动的函数
 * 还原所有节点连线的时间轴联动效果
 * */
function timelineClear () {
  // console.log('timelineClear');
  nodesContainer.selectAll('image')
    .classed('timeLineSelected', false)
  nodesContainer.selectAll('text')
    .classed('timeLineSelected', false)
  linksContainer.selectAll('path')
    .classed('timeLineSelected', false)
  linksContainer.selectAll('text')
    .classed('timeLineSelected', false)
}
/**
 * 与时间轴联动的函数
 * 根据id的数组来控制哪些节点和连线隐藏
 * @param {Object} set 保存有需要进行显示的节点的id数组
 * */
function timelineSelected (set) {
  // console.log('timelineUpdate');
  timelineClear()
  nodesContainer.selectAll('image')
    .filter(d => !set.has(d.id))
    .classed('timeLineSelected', true)
  nodesContainer.selectAll('text')
    .filter(d => !set.has(d.id))
    .classed('timeLineSelected', true)
  linksContainer.selectAll('path')
    .filter(d => !(set.has(d.startNode) || set.has(d.endNode)))
    .classed('timeLineSelected', true)
  linksContainer.selectAll('text')
    .filter(d => !(set.has(d.startNode) || set.has(d.endNode)))
    .classed('timeLineSelected', true)
}

/**
 *@filename:createForceSimulation.js
 *@method:
 *@abstract: 勾选框联动函数，通过勾选控制哪些点显示
 *@parma {}
 *@return
 *@author:liujia
 *@time:2017/6/4 0004
 *@version
 */
/* eslint-disable arrow-parens,arrow-body-style */
function checkFilter (set) {
  // console.log('set');
  // console.log(set);
  const nodeSet = new Set()
  set.forEach((v, i) => {
    nodesContainer.selectAll('image')
      .filter(d => {
        if (d.properties.type === v) {
          nodeSet.add(d.id)
        }
        return d.properties.type === v
      })
  })
  nodesContainer.selectAll('image')
    .filter(d => nodeSet.has(d.id))
    .classed('timeLineSelected', true)
  nodesContainer.selectAll('text')
    .filter(d => nodeSet.has(d.id))
    .classed('timeLineSelected', true)
  linksContainer.selectAll('path')
    .filter(d => (nodeSet.has(d.startNode) || nodeSet.has(d.endNode)))
    .classed('timeLineSelected', true)
  linksContainer.selectAll('text')
    .filter(d => (nodeSet.has(d.startNode) || nodeSet.has(d.endNode)))
    .classed('timeLineSelected', true)
  nodesContainer.selectAll('image')
    .filter(d => !nodeSet.has(d.id))
    .classed('timeLineSelected', false)
  nodesContainer.selectAll('text')
    .filter(d => !nodeSet.has(d.id))
    .classed('timeLineSelected', false)
  linksContainer.selectAll('path')
    .filter(d => !(nodeSet.has(d.startNode) || nodeSet.has(d.endNode)))
    .classed('timeLineSelected', false)
  linksContainer.selectAll('text')
    .filter(d => !(nodeSet.has(d.startNode) || nodeSet.has(d.endNode)))
    .classed('timeLineSelected', false)
}

export {
  start,
  expandNode,
  switchBrush,
  removeNode,
  rescale,
  cut,
  brushSelectedNodes,
  nodes,
  links,
  zoomIn,
  zoomOut,
  removeNodes,
  makeGroup,
  releaseGroup,
  getNodes,
  timelineSelected,
  timelineClear,
  checkData,
  checkFilter,
  eventCount,
  onceClick
}
