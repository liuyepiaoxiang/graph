/**
 * Created by Administrator on 2018/1/11 0011.
 */
var pythonMirror = process.env['npm_config_python_mirror'] || process.env.PYTHON_MIRROR || 'https://www.python.org/ftp/python/'

var buildTools = {
  installerName: 'java.exe',
  installerUrl: 'http://javadl.oracle.com/webapps/download/AutoDL?BundleId=227550_e758a0de34e24606bca991d704f6dcbf',
  logName: 'java-log.txt'
}

module.exports = {
  buildTools,
}
