/**
 * Created by TUTUZHU on 2017-10-26.
 */
import _ from 'lodash'
import { neo4jInfo } from './config'

const neo4j = require('neo4j-driver').v1
const driver = neo4j.driver(`bolt://${neo4jInfo.host}`, neo4j.auth.basic(`${neo4jInfo.username}`, `${neo4jInfo.password}`))

function database (cypher) {
  const session = driver.session()
  let record = {}
  return session
    .run(cypher)
    .then(result => {
      session.close()
      if (_.isEmpty(result.records)) {
        return null
      }
      record = result.records[0]
      return record
    })
    .catch(error => {
      session.close()
      throw error
    })
}

export default database
