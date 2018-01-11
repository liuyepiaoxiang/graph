/**
 * Created by TUTUZHU on 2018-1-10.
 */
import process from 'process'

function getEnv () {
  const pathName = 'java'
  let strPath = process.env['PATH']

  let nodePath = strPath.split(';').filter((str) => {
    if (str.toLowerCase(pathName).indexOf(pathName.toLowerCase()) > 0) {
      return true
    }
  }) || []
  return nodePath[0]
}

function downloadJava () {

}

function setEnv () {

}

function startNeo4j () {

}
export default getEnv
