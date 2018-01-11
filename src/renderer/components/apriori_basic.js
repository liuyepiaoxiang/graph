/**
 * Created by TUTUZHU on 2017-10-23.
 */
import * as _ from 'lodash'
const minSup = 2
// const minConfidence = 0.6

let dataArr = []
let singelP = []
let pairsP = []
let dataLength = 0
function AprioriFun (data = []) {
  console.log('getdata', data)
  dataArr = data
  dataLength = data.length
  let Ck1 = freq1Gen(data)
  console.log('first', Ck1)
  let Ck
  /* while (Ck1.length !== 0) {
    Ck = Ck1
    Ck1 = freqKGen(Ck)
  } */
  Ck = Ck1
  Ck1 = freqKGen(Ck)
  console.log('second', Ck)
  console.log('second', Ck1)
  calculateS()
  return pairsP
}

/* var I1='I1',I2='I2',I3='I3',I4='I4',I5='I5';
var dataArr=[
[I1,I2,I5],
[I2,I4],
[I2,I3],
[I1,I2,I4],
[I1,I3],
[I2,I3],
[I1,I3],
[I1,I2,I3,I5],
[I1,I2,I3],
]; */

// 1.计算候选集C1
function freq1Gen (data) {
  const buffer = []
  let isShow = false
  for (var i = data.length - 1; i >= 0; i--) {
    for (var j = data[i].length - 1; j >= 0; j--) {
      isShow = false
      for (let k = buffer.length - 1; k >= 0; k--) {
        if (buffer[k].name === data[i][j]) {
          buffer[k].count++
          isShow = true
          break
        }
      }
      if (isShow === false) {
        buffer.push({
          name: data[i][j],
          count: 1
        })
      }
    }
  }
  const ret = []
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i].count >= minSup) {
      ret.push([buffer[i].name])
      singelP.push({
        name: buffer[i].name,
        count: buffer[i].count,
        support: parseFloat(buffer[i].count) / parseFloat(dataLength)
      })
    }
  }
  return ret
}

// 2.计算候选集C(k+1)
function freqKGen (data) {
  let candi = []
  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {
      candi.push(_.uniq(data[i].concat(data[j])))
    }
  }
  candi = unique(candi)
  const buffer = []
  for (let i = candi.length - 1; i >= 0; i--) {
    buffer.push({arr: candi[i], count: 0})
  }
  console.log('data', dataArr)
  // 计算支持数
  for (let i = buffer.length - 1; i >= 0; i--) {
    for (let j = dataArr.length - 1; j >= 0; j--) {
      if (isContain(dataArr[j], buffer[i].arr)) {
        buffer[i].count++
      }
    }
  }
  console.log('支持度', buffer)
  // 剪枝
  const ret = []
  for (let i = buffer.length - 1; i >= 0; i--) {
    if (buffer[i].count >= minSup) {
      ret.push(buffer[i].arr)
      pairsP.push({
        arr: buffer[i].arr,
        count: buffer[i].count,
        support: parseFloat(buffer[i].count) / parseFloat(dataLength)
      })
    }
  }
  console.log('ret', ret)
  console.log('singelP', singelP)
  console.log('pairsP', pairsP)
  return ret
}

// 判断arr1是否包含arr2
function isContain (arr1, arr2) {
  for (let i = arr2.length - 1; i >= 0; i--) {
    if (!arr1.includes(arr2[i])) {
      return false
    }
  }
  return true
}

function unique (arr) {
  const toDel = []
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i].length === arr[j].length) {
        let flag = true
        for (let k = 0; k < arr[j].length; k++) {
          if (!arr[i].includes(arr[j][k])) {
            flag = false
            break
          }
        }
        if (flag) {
          toDel.push(i)
          break
        }
      }
    }
  }
  for (let i = toDel.length - 1; i >= 0; i--) {
    arr.splice(toDel[i], 1)
  }
  return arr
}

function calculateS () {
  pairsP.forEach((p) => {
    p.startNode = p.arr[0]
    p.endNode = p.arr[1]
    singelP.forEach((s) => {
      if (s.name === p.arr[0]) {
        p.startP = s.support
        p.confidenceStoE = parseFloat(p.count) / parseFloat(s.count)
      }
      if (s.name === p.arr[1]) {
        p.endP = s.support
        p.confidenceEtoS = parseFloat(p.count) / parseFloat(s.count)
      }
      p.liftStoE = p.confidenceStoE / p.endP
      p.liftEtoS = p.confidenceEtoS / p.startP
    })
  })
  return pairsP
}

export {
  AprioriFun
}
