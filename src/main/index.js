'use strict'

/* import { readFileSync, writeFile } from 'fs'
import os from 'os' */
import path from 'path'
import fs from 'fs'
/* import { app, BrowserWindow, ipcMain, protocol, shell, systemPreferences, dialog } from 'electron' */
import { app, BrowserWindow, ipcMain } from 'electron'
// import getEnv from './getPath'
import database from './neo4jDriver'
import { names } from './config'
import cypher from './neo4jSearch'
// import xlsx from 'xlsx'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 563,
    useContentSize: true,
    width: 1000
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // getEnv()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

// open the item on host
ipcMain.on('send-name', (event) => {
  event.returnValue = names
})

ipcMain.on('save-name', (event, data) => {
  console.log(data)
  fs.readFile('config/neo4j.js', 'utf-8', (err, data) => {
    if (err) {
      console.log('error')
    } else {
      console.log(data)
    }
  })
})

ipcMain.on('insert-node', (event, data) => {
  data.forEach((node, i) => {
    const cypher = `MERGE (n:sku {skuid: '${node.skuid}', skuname: '${node.skuName}'})`
    database(cypher)
    event.sender.send('node-reply', {
      percentage: i * 40 / data.length,
      message: `正在插入第${i}个节点，共${data.length}个节点`
    })
  })
  const cypherR = 'MATCH (n)-[r]-(m) DELETE r'
  database(cypherR)
  event.sender.send('node-reply', {
    percentage: 40,
    message: `节点插入完成，共插入${data.length}个节点`
  })
})

ipcMain.on('insert-relation', (event, data) => {
  data.forEach((relation, i) => {
    const cypher1 = `
    MATCH (n:sku{skuid:'${relation.arr[0]}'})  
    MATCH (m:sku{skuid:'${relation.arr[1]}'})
    MERGE (n)-[r:support]->(m) 
    set r.lift = '${relation.liftStoE}',r.confidence = '${relation.confidenceStoE}',r.support = '${relation.support}'
      `
    const cypher2 = `
    MATCH (n:sku{skuid:'${relation.arr[1]}'})  
    MATCH (m:sku{skuid:'${relation.arr[0]}'})
    MERGE (n)-[r:support]->(m) 
    set r.lift = '${relation.liftEtoS}',r.confidence = '${relation.confidenceEtoS}',r.support = '${relation.support}'
      `
    // const cypherDefault = `MATCH (n:people{name:'小'})  MATCH (m:people{name:'小红'})  CREATE (n)-[r:support]->(m) set r.lift = '0.13'`
    database(cypher1)
    database(cypher2)
    event.sender.send('relation-reply', {
      percentage: i * 40 / data.length,
      message: `正在插入第${i}条关系，共${data.length}条关系`
    })
  })
  event.sender.send('relation-reply', {
    percentage: 40,
    message: `导入完成`
  })
})

ipcMain.on('clear-database', (event, data) => {
  data.forEach((node, i) => {
    const cypher = `CREATE (n:sku {skuid: '${node.skuid}', skuname: '${node.skuName}'})`
    // const cypherDefault = `MATCH (n)-[r]-() DELETE n,r `
    database(cypher)
    event.sender.send('relation-reply', {
      percentage: i * 20 / data.length,
      message: `正在插入第${i}条关系，共${data.length}个节点`
    })
  })
  event.sender.send('node-reply', {
    percentage: 20,
    message: '节点插入完成'
  })
})

ipcMain.on('search-graph', (event, data) => {
  const graph = cypher(data, '', res => {
    event.sender.send('graph-reply', res)
  })
})
/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
