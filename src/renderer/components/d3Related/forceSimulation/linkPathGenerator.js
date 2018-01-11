/**
 * Created by Administrator on 2017/5/26 0026.
 */
/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
/**
 * 生成力导向节点所需要的path路劲,针对于直线
 * @param {Object} startPoint 起始节点对象
 * @param {Object} endPoint 终止节点对象
 * @param {Object} deflection 连线相对于水平线的角度
 * @param {Object} startRadius 其实节点虚拟半径
 * @param {Object} endRadius 终止节点虚拟半径
 * @param {Object} shaftWidth 箭头身体直径
 * @param {Object} headWidth 箭头宽度
 * @param {Object} headHeight 箭头长度
 * @return
 * */
/* eslint-disable max-len */
function StraightDraw(startPoint, endPoint, deflection = 0, startRadius = 25, endRadius = 25, shaftWidth = 1 / 4, headWidth = 4, headHeight = 4) {
  const square = l => l * l;
  // const deflection = 25;
  const arcRadius = 0;
  // const startRadius = 25;
  // const endRadius = 25;
  // const shaftWidth = 1 / 4;
  // const headWidth = 4; // 箭头宽度
  // const headHeight = 4; // 箭头长度
  const dx = endPoint.x - startPoint.x; // 两点之间的水平距离
  const dy = endPoint.y - startPoint.y; // 两点之间的垂直距离
  const centreDistance = Math.sqrt(square(dy) + square(dx)); // 两点圆心连线的距离，即圆心间距
  const length = centreDistance - (startRadius + endRadius); // 两节点圆去掉半径的间距（不算半径的最小间距），也即箭头总长；
  const shaftLength = length - headHeight; // 箭头的身体长度（箭头总长度减去箭头头部宽度）；todo

  // 以下确定箭头画法各个点之间的关系及计算（以出发节点的圆心为原点）；
  const startArrow = startRadius;// 箭头起始点的X坐标（尾巴）
  const endShaft = startArrow + shaftLength;// 箭头肩部位置的X坐标；
  const shaftRadius = shaftWidth / 2;// 箭头身体轴半径
  const headRadius = headWidth / 2; // 箭头头部轴半径
  const endArrow = startArrow + length; // 箭头尖X轴坐标
  const midpoint = (shaftLength / 2) + startArrow; // 计算中点坐标供文字使用

  /**
   * 返回连线路径
   * @param {Number} shortCaptionLength 连线中间文字的预留位置，即断开宽度
   * */
  this.outline = (shortCaptionLength = 0) => {
    const startBreak = startArrow + ((shaftLength - shortCaptionLength) / 2);
    const endBreak = endShaft - ((shaftLength - shortCaptionLength) / 2);
    return ['M', startArrow, shaftRadius, 'L', startBreak, shaftRadius, 'L', startBreak, -shaftRadius, 'L', startArrow, -shaftRadius, 'Z', 'M', endBreak, shaftRadius, 'L', endShaft, shaftRadius, 'L', endShaft, headRadius, 'L', endArrow, 0, 'L', endShaft, -headRadius, 'L', endShaft, -shaftRadius, 'L', endBreak, -shaftRadius, 'Z'].join(' ');
  };

  // 新增一个确定文字位置的方法——hth20160726
  this.textpos_x = () => Number(midpoint);
  this.textpos_y = () => {
    // todo:y的计算可能存在问题
    const y = 0;
    // const y = arcRadius - Math.sqrt(Math.abs(square(arcRadius) - (square(centreDistance) / 4)));
    if (deflection > 0) {
      return y;
    }
    if (deflection === 0) {
      return -30;
    }
    return -y;
  };
  // 该方法确定关系文字说明元素的scrollWidth宽度，以此同步关系线条中间断开部分的宽度。并在一定条件下使关系线条没有断开；
  this.textWidth = (d) => {
    const ele = document.getElementById(`linkText_${d.id}`);
    if (ele) {
      const o = document.getElementById(`linkText_${d.id}`).getBBox().width;
      if (centreDistance > 2 * o && centreDistance > 100) {
        return o * 1.2;
      }
    }
    return 0;
  };
}

/**
 * 生成力导向节点所需要的path路劲，针对于多条关系弧线
 * @param {Object} startPoint 起始节点对象
 * @param {Object} endPoint 终止节点对象
 * @param {Object} deflection 连线相对于水平线的角度
 * @param {Object} startRadius 其实节点虚拟半径
 * @param {Object} endRadius 终止节点虚拟半径
 * @param {Object} arrowWidth 箭头身体直径
 * @param {Object} headWidth 箭头宽度
 * @param {Object} headLength 箭头长度
 * @return
 * */
function ArcDraw(startPoint, endPoint, deflection = 30, startRadius = 25, endRadius = 25, arrowWidth = 1 / 4, headWidth = 4, headLength = 4) {
  const captionLayout = 'external';
  const square = l => l * l;
  const dx1 = endPoint.x - startPoint.x; // 两点之间的水平距离
  const dy1 = endPoint.y - startPoint.y; // 两点之间的垂直距离
  const centreDistance = Math.sqrt(square(dy1) + square(dx1)); // 两点圆心连线的距离，即圆心间距
  const length = centreDistance - (startRadius + endRadius); // 两节点圆去掉半径的间距（不算半径的最小间距），也即箭头两端点的长度；
  let shaftLength = length - headLength;
  const midpoint = (shaftLength / 2) + startRadius; // 相对于起始点的中点x坐标
  const endCentre = centreDistance;
  const deflectionRadians = deflection * ((2 * Math.PI) / 360);// 将角度乘以 0.017453293 （2PI/360）即可转换为弧度；
  const startAttach = {
    x: Math.cos(deflectionRadians) * startRadius,
    y: Math.sin(deflectionRadians) * startRadius,
  };
  const radiusRatio = startRadius / (endRadius + headLength);// 半径比率（因为两圆大小相等属于特殊情况，所以将第二个圆半径扩大headLength使得变为通常状况，此时两圆才有外心）；
  // homotheticCenter = -endCentre * radiusRatio / (1 - radiusRatio);//由两个相似三角形比例关系，得出位似圆心的X轴坐标（注意：此处为外离公切线的外位似圆心  ）；
  // hth20160822部分存在无穷大状况(当(1 - radiusRatio)==0时)；上面的写法改成如下：
  const homotheticCenter = ((1 - radiusRatio) === 0) ? ((-endCentre * radiusRatio) / ((1 / 2) - radiusRatio)) : (-(endCentre * radiusRatio) / (1 - radiusRatio));
  function intersectWithOtherCircle(fixedPoint, radius, xCenter, polarity) {
    const gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);// 梯度，斜度，变化率；此为过相似圆心homotheticCenter的一条直线；
    const hc = fixedPoint.y - (gradient * fixedPoint.x);// y=kx+b可以得出b=y-kx,即b=yo-kx0；
    const A = 1 + square(gradient);// Ax²+BX+C=0;此处联立直线和圆的方程求解；
    const B = 2 * ((gradient * hc) - xCenter);// 通过圆的标准方程和直线方程联立求得起交点坐标；
    const C = square(hc) + (square(xCenter) - square(radius));// 通过圆的标准方程和直线方程联立求得起交点坐标；
    const intersection = {
      y: (-B + ((polarity * Math.sqrt(square(B))) - (4 * A * C))) / (2 * A), // 通过圆的标准方程和直线方程联立求得起交点坐标；
      x: (-B + (polarity * Math.sqrt(square(B) - (4 * A * C)))) / (2 * A), // 通过圆的标准方程和直线方程联立求得起交点坐标；
    };
    intersection.y = (intersection.x - homotheticCenter) * gradient;// 类似直线方程，带入X求得Y值；
    return intersection;
  }
  const endAttach = intersectWithOtherCircle(startAttach, endRadius + headLength, endCentre, -1);
  const g1 = -startAttach.x / startAttach.y; // 通过(CX,CY)与(startAttach)的直线的斜率；通过k=tanx求得；——————————————此处假设这条直线与start圆相切！！！！！
  const c1 = startAttach.y + (square(startAttach.x) / startAttach.y); // 已知斜率和一点，可求得b；
  const g2 = -(endAttach.x - endCentre) / endAttach.y; // 同g1,此为通过(CX,CY)与(endAttach)的直线的斜率；——————————————此处假设这条直线与end圆相切！！！！！
  const c2 = endAttach.y + (((endAttach.x - endCentre) * endAttach.x) / endAttach.y); // 同g2;
  // hth20160823  g1 and g2 are equal in some certain case;
  const cx = (c1 - c2) / (g2 - g1) || (c1 - c2) / (g2 - (g1 * (11 / 10))); // 两条直线的交点，联立直线方程求得cx；
  const cy = (g1 * cx) + c1; // 类似于直线公式y=kx+b；
  const arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y));

  const startAngle = Math.atan2(startAttach.x - cx, cy - startAttach.y); // 将startAttach的坐标转换为以最大圆圆心为原点的坐标系中的坐标；
  const endAngle = Math.atan2(endAttach.x - cx, cy - endAttach.y);
  let sweepAngle = endAngle - startAngle;
  if (deflection > 0) { // 默认情况下，y轴正方向向下？？？默认情况下deflection<0？？？；
    sweepAngle = (2 * Math.PI) - sweepAngle;
  }
  shaftLength = sweepAngle * arcRadius; // 半径乘以弧度=弧长；
  if (startAngle > endAngle) {
    shaftLength = 0;
  }
  let midShaftAngle = (startAngle + endAngle) / 2;
  if (deflection > 0) {
    midShaftAngle += Math.PI;
  }
  const midShaftPoint = {
    x: cx + (arcRadius * Math.sin(midShaftAngle)),
    y: cy - (arcRadius * Math.cos(midShaftAngle)),
  };
  function startTangent(dr) {
    const dx = (dr < 0 ? 1 : -1) * Math.sqrt(square(dr) / (1 + square(g1)));
    const dy = g1 * dx;
    return {
      x: startAttach.x + dx,
      y: startAttach.y + dy,
    };
  }
  function endTangent(dr) {
    const dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
    const dy = g2 * dx;
    return {
      x: endAttach.x + dx,
      y: endAttach.y + dy,
    };
  }
  function angleTangent(angle, dr) {
    return {
      x: cx + ((arcRadius + dr) * Math.sin(angle)),
      y: cy - ((arcRadius + dr) * Math.cos(angle)),
    };
  }

  function endNormal(dc) {
    const dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
    const dy = dx / g2;
    return {
      x: endAttach.x + dx,
      y: endAttach.y - dy,
    };
  }
  /* overlay部分，暂时屏蔽————hth
   const endOverlayCorner = function (dr, dc) {
   const shoulder = endTangent(dr);
   const arrowTip = endNormal(dc);
   return {
   x: shoulder.x + arrowTip.x - endAttach.x, // arrowTip.x - endAttach.x为arrowTip在endAttach的基础上的X轴增量；
   y: shoulder.y + arrowTip.y - endAttach.y, // 同上；给shoulder点进行相同的增量保证平行；
   };
   };
   */
  function coord(point) {
    return `${point.x},${point.y}`;
  }
  const shaftRadius = arrowWidth / 2;
  const headRadius = headWidth / 2;
  const positiveSweep = startAttach.y > 0 ? 0 : 1;
  const negativeSweep = startAttach.y < 0 ? 0 : 1;

  this.outline = (shortCaptionLength = 0) => { // outline为连线路径；shortCaptionLength为关系描述标题的长度；
    let captionSweep;
    let endBreak;
    let startBreak;
    if (startAngle > endAngle) {
      return ['M', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'Z'].join(' '); // 将单纯箭头画法的数组转换为字符串返回；
    }
    if (captionLayout === 'external') { // 第一种返的是中间带有断开位置的弧形画法数组；第二种返回的是中间不带标题位置的画法数组；
      captionSweep = shortCaptionLength / arcRadius; // 关系标题文字的弧度等于弧长除以半径；//captionSweep为一个绝对正值，即不带方向性。涉及到它的运算时请考虑前面符号的正负；
      if (deflection > 0) {
        captionSweep *= -1;
      }
      startBreak = midShaftAngle - (captionSweep / 2); // 该值为角度；
      endBreak = midShaftAngle + (captionSweep / 2);
      return ['M', coord(startTangent(shaftRadius)), 'L', coord(startTangent(-shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(angleTangent(startBreak, -shaftRadius)), 'L', coord(angleTangent(startBreak, shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(startTangent(shaftRadius)), 'Z', 'M', coord(angleTangent(endBreak, shaftRadius)), 'L', coord(angleTangent(endBreak, -shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(endTangent(-shaftRadius)), 'L', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'L', coord(endTangent(shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(angleTangent(endBreak, shaftRadius))].join(' ');
    }
    return ['M', coord(startTangent(shaftRadius)), 'L', coord(startTangent(-shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(endTangent(-shaftRadius)), 'L', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'L', coord(endTangent(shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(startTangent(shaftRadius))].join(' ');
  };
  this.textpos_x = () => Number(midpoint);
  this.textpos_y = () => {
    /* eslint-disable no-unreachable */
    let y;
    if (cy > 0) {
      y = (arcRadius - cy) + 30;
    } else {
      y = (arcRadius + cy) - 30;
    }
    // const y = (arcRadius - cy) + 30;
    // const y = arcRadius - Math.sqrt(Math.abs(square(arcRadius) - (square(centreDistance) / 4)));
    if (deflection > 0) {
      return y;
    }
    if (deflection === 0) {
      return 0;
    }
    return -y;
  };
  // 该方法确定关系文字说明元素的scrollWidth宽度，以此同步关系线条中间断开部分的宽度。并在一定条件下使关系线条没有断开；
  this.textWidth = (d) => {
    const ele = document.getElementById(`linkText_${d.id}`);
    if (ele) {
      const o = document.getElementById(`linkText_${d.id}`).getBBox().width;
      if (centreDistance > 2 * o && centreDistance > 100) {
        return o * 1.2;
      }
    }
    return 0;
  };
}

/**
 * 根据数据d选择直线或者弧线画法，同时返回该画法
 * @param {Object} d 传入的数据，为力导向links数组中的某一项数据
 * 其中，必须包含
 * d.nodeA 表示link的方向性
 * d.pathIndex 表示link在两个节点之间所有关系中的序列
 * d.pathCount 表示该link的起始终止节点之间所有的关系总数
 * @return {Object} path 返回直线或者弧线画法的函数实例
 * */
function selectPath(d) {
  const startRadius = 28;
  const endRadius = 28;
  // links的线宽
  const arrowWidth = 1 / 4; // 1/8;因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
  const arrowWidth2 = arrowWidth * 20;
  // 箭头尖端宽度
  const headWidth = 6; // 因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
  const headWidth2 = headWidth * 2;
  // 箭头尖端长度
  const headHeight = 6; // 因为卡顿，背景选择线屏蔽，将此处加粗方便鼠标选取；
  const headHeight2 = headHeight * 3;

  // tick内部重复用到的参数在此处统一设置，下面重复的部分删除；
  const defaultDeflectionStep = 9; // 弧线的默认起始角度（与水平方向的夹角）
  const maximumTotalDeflection = 150; // 弧线的最大角度
  const middleRelationshipIndex = (d.pathCount - 1) / 2;
  const numberOfSteps = d.pathIndex - 1;
  const totalDeflection = defaultDeflectionStep * numberOfSteps;
  const deflectionStep = totalDeflection > maximumTotalDeflection ? maximumTotalDeflection / numberOfSteps : defaultDeflectionStep;
  let deflection = deflectionStep * (d.pathIndex - middleRelationshipIndex);
  // 下面代码必须有，不然起点不同的箭头可能重叠；
  if (d.nodeA !== d.source.id) {
    deflection *= -1;
  }
  if (d.pathIndex !== middleRelationshipIndex) {
    const path = new ArcDraw({ x: d.source.x, y: d.source.y }, {
      x: d.target.x,
      y: d.target.y,
    }, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
    return path;
  }
  const path = new StraightDraw({ x: d.source.x, y: d.source.y }, {
    x: d.target.x,
    y: d.target.y,
  }, deflection, startRadius, endRadius, arrowWidth, headWidth, headHeight);
  return path;
}

export { StraightDraw, ArcDraw, selectPath };
