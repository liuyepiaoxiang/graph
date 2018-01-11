/* eslint-disable semi,space-before-function-paren,no-unused-vars,comma-dangle */
function drawArc () {
  function drawStraight(startPoint, endPoint, deflection, startRadius, endRadius, shaftWidth, headWidth, headHeight) {
    let endArrow, endShaft, headRadius, shaftRadius, startArrow, centreDistance, dx, dy, length, shaftLength, midpoint, arcRadius;
    const square = function(l) {
      return l * l;
    };
    // ******* 其中参数在原版中根据样式确定并有调用函数通过参数方式传入，而非内部直接定义；
    // deflection = 30;
    arcRadius = 0;
    // startRadius = 26;
    // endRadius = 26;
    // shaftWidth = 1/4;
    // headWidth = 7;
    // headHeight = 7;
    // *******其中参数在原版中根据样式确定并有调用函数通过参数方式传入，而非内部直接定义；

    dx = endPoint.x - startPoint.x;
    dy = endPoint.y - startPoint.y;
    centreDistance = Math.sqrt(square(dy) + square(dx));
    /*
      this.length = centreDistance - (startRadius + endRadius);
      this.shaftLength = this.length - headHeight;
      */
    // 两节点圆的间距（不算半径的最小间距），也即箭头总长；
    length = centreDistance - (startRadius + endRadius);
    // 箭头的身体长度（箭头总长度减去箭头头部宽度）；
    shaftLength = length - headHeight;
    // 以下确定箭头画法各个点之间的关系及计算（以出发节点的圆心为原点）；
    // 箭头起始点的X坐标（尾巴）
    startArrow = startRadius;
    // 箭头肩部位置的X坐标；
    endShaft = startArrow + shaftLength;
    // 箭头身体轴半径
    shaftRadius = shaftWidth / 2;
    // 箭头头部轴半径
    headRadius = headWidth / 2;
    // 箭头尖X轴坐标
    endArrow = startArrow + length;
    // 计算中点坐标供文字使用
    midpoint = shaftLength / 2 + startArrow;
    /*
      //起始侧断点X坐标
      startBreak = startArrow + (this.shaftLength - shortCaptionLength) / 2;
      //目标侧断点X坐标
      endBreak = endShaft - (this.shaftLength - shortCaptionLength) / 2;
      */
    // startBreak = startArrow + (this.shaftLength - this.shortCaptionLength) / 2;//!!!!!!!!!!!!!!!this.shortCaptionLength???
    // endBreak = endShaft - (this.shaftLength - this.shortCaptionLength) / 2;
    this.outline = function (shortCaptionLength) {
      let endBreak, startBreak;
      startBreak = startArrow + (shaftLength - shortCaptionLength) / 2;
      endBreak = endShaft - (shaftLength - shortCaptionLength) / 2;
      return ['M', startArrow, shaftRadius, 'L', startBreak, shaftRadius, 'L', startBreak, -shaftRadius, 'L', startArrow, -shaftRadius, 'Z', 'M', endBreak, shaftRadius, 'L', endShaft, shaftRadius, 'L', endShaft, headRadius, 'L', endArrow, 0, 'L', endShaft, -headRadius, 'L', endShaft, -shaftRadius, 'L', endBreak, -shaftRadius, 'Z'].join(' ');
    };
    // 新增一个确定文字位置的方法——hth20160726
    this.textpos_x = function () {
      let x;
      x = midpoint;
      return x
    };
    this.textpos_y = function () {
      let y;
      y = arcRadius - Math.sqrt(Math.abs(square(arcRadius) - square(centreDistance) / 4));
      // console.log(Math.sqrt(square(arcRadius) - square(centreDistance)/4))
      // console.log(centreDistance)
      if (deflection > 0) {
        return y;
      } else {
        if (deflection === 0) {
          return 0;
        } else {
          return -y;
        }
      }
    };
    // 该方法确定关系文字说明元素的scrollWidth宽度，以此同步关系线条中间断开部分的宽度。并在一定条件下使关系线条没有断开；
    this.textWidth = function (d) {
      let o, w;
      o = document.getElementById('ppt-text_' + d.id);
      w = o.scrollWidth || 0; // 宽度
      if (centreDistance > 4 * w && centreDistance > 20) {
        return w;
      } else {
        return 0;
      }
    };
  }

  function drawArc (startPoint, endPoint, deflection, startRadius, endRadius, arrowWidth, headWidth, headLength) {
    let angleTangent, arcRadius, c1, c2, coord, cx, cy, deflectionRadians, endAngle, endAttach, endNormal, endOverlayCorner, endTangent, g1, g2,
      headRadius, homotheticCenter, intersectWithOtherCircle, midShaftAngle, negativeSweep, positiveSweep, radiusRatio, shaftRadius, square,
      startAngle, startAttach, startTangent, sweepAngle, /* hih中间为改动时添加的参数 */
      endCentre, captionLayout, dx1, dy1, centreDistance, shaftLength, midpoint/* hih */;
    // 其中参数暂时强制设定为固定值，原版根据调用函数的参数变量不同
    // deflection = 30;//重要参数
    // startRadius = 26;
    // endRadius = 26;
    // arrowWidth  = 1/4;
    // headWidth = 7;
    // headLength = 7;
    captionLayout = 'external';
    dx1 = endPoint.x - startPoint.x;
    dy1 = endPoint.y - startPoint.y;
    square = function(l) {
      return l * l;
    };
    centreDistance = Math.sqrt(square(dy1) + square(dx1));
    let length = centreDistance - (startRadius + endRadius);
    shaftLength = length - headLength;
    midpoint = shaftLength / 2 + startRadius;
    endCentre = centreDistance;
    deflectionRadians = deflection * Math.PI / 180;// 将角度乘以 0.017453293 （2PI/360）即可转换为弧度；
    startAttach = {
      x: Math.cos(deflectionRadians) * startRadius,
      y: Math.sin(deflectionRadians) * startRadius
    };

    radiusRatio = startRadius / (endRadius + headLength);// 半径比率（因为两圆大小相等属于特殊情况，所以将第二个圆半径扩大headLength使得变为通常状况，此时两圆才有外心）；
    // hth20160822，当endRadius小于一定值时会报错，推测在此处应做条件判定。
    // if(startRadius>=endRadius){
    //  radiusRatio *= -1;
    // }
    // homotheticCenter = -endCentre * radiusRatio / (1 - radiusRatio);//由两个相似三角形比例关系，得出位似圆心的X轴坐标（注意：此处为外离公切线的外位似圆心  ）；
    // hth20160822部分存在无穷大状况(当(1 - radiusRatio)==0时)；上面的写法改成如下：
    homotheticCenter = ((1 - radiusRatio) === 0) ? (-endCentre * radiusRatio / (1 / 2 - radiusRatio)) : (-endCentre * radiusRatio / (1 - radiusRatio))
    // console.log(homotheticCenter)

    intersectWithOtherCircle = function(fixedPoint, radius, xCenter, polarity) {
      let A, B, C, gradient, hc, intersection;
      gradient = fixedPoint.y / (fixedPoint.x - homotheticCenter);// 梯度，斜度，变化率；此为过相似圆心homotheticCenter的一条直线；
      hc = fixedPoint.y - gradient * fixedPoint.x;// y=kx+b可以得出b=y-kx,即b=yo-kx0；
      A = 1 + square(gradient);// Ax²+BX+C=0;此处联立直线和圆的方程求解；
      B = 2 * (gradient * hc - xCenter);// 通过圆的标准方程和直线方程联立求得起交点坐标；
      C = square(hc) + square(xCenter) - square(radius);// 通过圆的标准方程和直线方程联立求得起交点坐标；
      intersection = {
        x: (-B + polarity * Math.sqrt(square(B) - 4 * A * C)) / (2 * A)// 通过圆的标准方程和直线方程联立求得起交点坐标；
      };
      intersection.y = (intersection.x - homotheticCenter) * gradient;// 类似直线方程，带入X求得Y值；
      return intersection;
    };
    endAttach = intersectWithOtherCircle(startAttach, endRadius + headLength, endCentre, -1);
    g1 = -startAttach.x / startAttach.y;// 通过(CX,CY)与(startAttach)的直线的斜率；通过k=tanx求得；——————————————此处假设这条直线与start圆相切！！！！！
    c1 = startAttach.y + (square(startAttach.x) / startAttach.y);// 已知斜率和一点，可求得b；
    g2 = -(endAttach.x - endCentre) / endAttach.y;// 同g1,此为通过(CX,CY)与(endAttach)的直线的斜率；——————————————此处假设这条直线与end圆相切！！！！！
    c2 = endAttach.y + (endAttach.x - endCentre) * endAttach.x / endAttach.y;// 同g2;
    // hth20160823  g1 and g2 are equal in some certain case;
    cx = (c1 - c2) / (g2 - g1) || (c1 - c2) / (g2 - g1 * 11 / 10);// 两条直线的交点，联立直线方程求得cx；
    cy = g1 * cx + c1;// 类似于直线公式y=kx+b；
    // console.log(endAttach.y)
    arcRadius = Math.sqrt(square(cx - startAttach.x) + square(cy - startAttach.y));
    // hth20160823g1 and g2 are equal in some certain case;
    // console.log(g1)
    // console.log(g2)
    // console.log(square(cy - startAttach.y))
    startAngle = Math.atan2(startAttach.x - cx, cy - startAttach.y);// 将startAttach的坐标转换为以最大圆圆心为原点的坐标系中的坐标；
    endAngle = Math.atan2(endAttach.x - cx, cy - endAttach.y);
    sweepAngle = endAngle - startAngle;
    if (deflection > 0) { // 默认情况下，y轴正方向向下？？？默认情况下deflection<0？？？；
      sweepAngle = 2 * Math.PI - sweepAngle;
    }
    shaftLength = sweepAngle * arcRadius;// 半径乘以弧度=弧长；
    if (startAngle > endAngle) {
      shaftLength = 0;
    }
    midShaftAngle = (startAngle + endAngle) / 2;
    if (deflection > 0) {
      midShaftAngle += Math.PI;
    }
    midShaftPoint = {
      x: cx + arcRadius * Math.sin(midShaftAngle),
      y: cy - arcRadius * Math.cos(midShaftAngle)
    };
    startTangent = function(dr) {
      let dx, dy;
      dx = (dr < 0 ? 1 : -1) * Math.sqrt(square(dr) / (1 + square(g1)));
      dy = g1 * dx;
      return {
        x: startAttach.x + dx,
        y: startAttach.y + dy
      };
    };
    endTangent = function(dr) {
      let dx, dy;
      dx = (dr < 0 ? -1 : 1) * Math.sqrt(square(dr) / (1 + square(g2)));
      dy = g2 * dx;
      return {
        x: endAttach.x + dx,
        y: endAttach.y + dy
      };
    };
    angleTangent = function(angle, dr) {
      return {
        x: cx + (arcRadius + dr) * Math.sin(angle),
        y: cy - (arcRadius + dr) * Math.cos(angle)
      };
    };

    endNormal = function(dc) {
      let dx, dy;
      dx = (dc < 0 ? -1 : 1) * Math.sqrt(square(dc) / (1 + square(1 / g2)));
      dy = dx / g2;
      return {
        x: endAttach.x + dx,
        y: endAttach.y - dy
      };
    };
    /* overlay部分，暂时屏蔽————hth
     endOverlayCorner = function(dr, dc) {
     var arrowTip, shoulder;
     shoulder = endTangent(dr);
     arrowTip = endNormal(dc);
     return {
     x: shoulder.x + arrowTip.x - endAttach.x,//arrowTip.x - endAttach.x为arrowTip在endAttach的基础上的X轴增量；
     y: shoulder.y + arrowTip.y - endAttach.y,//同上；给shoulder点进行相同的增量保证平行；
     };
     }; */
    coord = function(point) {
      return point.x + ',' + point.y;
    };
    shaftRadius = arrowWidth / 2;
    headRadius = headWidth / 2;
    positiveSweep = startAttach.y > 0 ? 0 : 1;
    negativeSweep = startAttach.y < 0 ? 0 : 1;
    this.outline = function(shortCaptionLength) { // outline为连线路径；shortCaptionLength为关系描述标题的长度；
      let captionSweep, endBreak, startBreak;
      if (startAngle > endAngle) {
        return ['M', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'Z'].join(' ');// 将单纯箭头画法的数组转换为字符串返回；
      }
      if (captionLayout === 'external') { // 第一种返的是中间带有断开位置的弧形画法数组；第二种返回的是中间不带标题位置的画法数组；
        captionSweep = shortCaptionLength / arcRadius;// 关系标题文字的弧度等于弧长除以半径；//captionSweep为一个绝对正值，即不带方向性。涉及到它的运算时请考虑前面符号的正负；
        if (deflection > 0) {
          captionSweep *= -1;
        }
        startBreak = midShaftAngle - captionSweep / 2;// 该值为角度；
        endBreak = midShaftAngle + captionSweep / 2;
        return ['M', coord(startTangent(shaftRadius)), 'L', coord(startTangent(-shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(angleTangent(startBreak, -shaftRadius)), 'L', coord(angleTangent(startBreak, shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(startTangent(shaftRadius)), 'Z', 'M', coord(angleTangent(endBreak, shaftRadius)), 'L', coord(angleTangent(endBreak, -shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(endTangent(-shaftRadius)), 'L', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'L', coord(endTangent(shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(angleTangent(endBreak, shaftRadius))].join(' ');
      } else {
        //   return ['M', coord(startTangent(shaftRadius)), 'L', coord(startTangent(-shaftRadius)), 'A', arcRadius - shaftRadius, arcRadius - shaftRadius, 0, 0, positiveSweep, coord(endTangent(-shaftRadius)), 'L', coord(endTangent(-headRadius)), 'L', coord(endNormal(headLength)), 'L', coord(endTangent(headRadius)), 'L', coord(endTangent(shaftRadius)), 'A', arcRadius + shaftRadius, arcRadius + shaftRadius, 0, 0, negativeSweep, coord(startTangent(shaftRadius))].join(' ');
      }
    };
    /* overlay部分，暂时屏蔽————hth
     this.overlay = function(minWidth) {//overlay为鼠标移上时的效果；
     var radius;
     radius = Math.max(minWidth / 2, shaftRadius);
     return ['M', coord(startTangent(radius)), 'L', coord(startTangent(-radius)), 'A', arcRadius - radius, arcRadius - radius, 0, 0, positiveSweep, coord(endTangent(-radius)), 'L', coord(endOverlayCorner(-radius, headLength)), 'L', coord(endOverlayCorner(radius, headLength)), 'L', coord(endTangent(radius)), 'A', arcRadius + radius, arcRadius + radius, 0, 0, negativeSweep, coord(startTangent(radius))].join(' ');
     }; */
    // 此处复制的直线画法中的文字中点方法
    this.textpos_x = function () {
      let x;
      x = midpoint;
      return x
    };
    this.textpos_y = function () {
      let y;
      y = arcRadius - Math.sqrt(Math.abs(square(arcRadius) - square(centreDistance) / 4));
      // console.log(Math.sqrt(square(arcRadius) - square(centreDistance)/4))
      // console.log(y)
      if (deflection > 0) {
        return y;
      } else {
        if (deflection === 0) {
          return 0;
        } else {
          // console.log(arcRadius)
          return -y;
        }
      }
    };
    // 该方法确定关系文字说明元素的scrollWidth宽度，以此同步关系线条中间断开部分的宽度。并在一定条件下使关系线条没有断开；
    this.textWidth = function (d) {
      let o, w;
      o = document.getElementById('ppt-text_' + d.id);
      w = o.scrollWidth || 0; // 宽度
      if (centreDistance > 4 * w && centreDistance > 20) {
        return w;
      } else {
        return 0;
      }
    };
  }

  const pathRoutings = {
    // NodePairsGroups : NodePairsGroups,
    straightdraw: drawStraight,
    arcdraw: drawArc
  }
  return pathRoutings;
}

export default drawArc
