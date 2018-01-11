/**
 * Created by TUTUZHU on 2017-11-21.
 */
import XLSX from 'xlsx'
import path from 'path'

function writeExcwl (arr) {
  const time = new Date().toLocaleString()
  const workbook = XLSX.utils.json_to_sheet(arr)
  const dir = path.join(__dirname, '/excel')
  XLSX.writeFile(workbook, `${dir}/out${time}.xlsx`)
}

export default writeExcwl
