/**
 * Created by TUTUZHU on 2017-12-11.
 */
import * as r from 'request'
import { neo4jInfo } from './config'

const txUrl = `http://${neo4jInfo.host}:${neo4jInfo.port}/db/data/transaction/commit`
const AUTHORIZATION = 'Basic ' + Buffer.from(neo4jInfo.username + ':' + neo4jInfo.password).toString('base64')
// TODO:因为不是promise方式，存在回调无法取到值的问题
function cypher (query, params, cb) {
  try {
    r.post({uri: txUrl,
      headers: { AUTHORIZATION },
      json: {statements: [{statement: query, 'resultDataContents': ['row', 'graph']}]}}, (err, res) => {
      if (err) {
        console.log(err)
      } else {
        cb(res)
      }
    })
  } catch (e) {
    console.log(e)
  }
}

export default cypher
