/**
 * Created by TUTUZHU on 2018-1-10.
 */
import process from 'process'

const download = require('./env/download')
const install = require('./env/install')
const environment = require('./env/environment')

function getEnv (pathName) {
  let strPath = process.env['PATH']

  let nodePath = strPath.split(';').filter((str) => {
    if (str.toLowerCase(pathName).indexOf(pathName.toLowerCase()) > 0) {
      return true
    }
  }) || []
  return nodePath[0]
}


function setEnv () {

}

function startNeo4j () {

}

function checkEnv () {
  const javaName = 'java'
  const neoName = 'neo4j'

  let javaPath = getEnv(javaName)
  let neoPath = getEnv(neoName)

  if (javaPath) {
    console.log('java path is ', javaPath)
  } else {
      download(function () {
          install(function (variables) {
              environment(variables)
          })
      })
  }
}
export default getEnv
