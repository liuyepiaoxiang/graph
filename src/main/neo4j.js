/**
 * Created by TUTUZHU on 2017-10-26.
 */
import neo4j from 'neo4j'
import { neo4jInfo } from './config'

const db = new neo4j.GraphDatabase(`http://${neo4jInfo.username}:${neo4jInfo.password}@${neo4jInfo.host}:${neo4jInfo.port}`)

function database (cypher) {
  db.cypher({
    query: cypher,
    params: {
      email: 'alice@example.com'
    }
  }, function (err, results) {
    if (err) throw err
    let result = results[0]
    if (!result) {
      console.log('No user found.')
    } else {
      const user = result['u']
      console.log(JSON.stringify(user, null, 4))
    }
  })
}

export default database
