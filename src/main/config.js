// 图谱数据库连接信息
const neo4jInfo = {
  host: 'localhost',
  port: 7474,
  username: 'neo4j',
  password: 123456
}
const names = {
  skus: ['skuid', 'sku', '商品编号', '货号'],
  bills: ['bill', 'billid', '单号'],
  skuInfos: ['品名', '商品名称', '品名规格']
}

export {
  neo4jInfo,
  names
}
