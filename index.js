const phantom = require('phantom')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const Parser = require('rss-parser');
const IPFS = require('ipfs-api')
const parser = require('./parse')
const express = require('express')

//let rssParser = new Parser();
const ipfs = IPFS('127.0.0.1', '5001',{protocol:'http'})
const server = express()
server.use(express.json())


server.get('/', (req, res) => {
  res.send({hello:'world'})
})
server.post('/api/v0/add', async (req, res) => {
  const json = req.body
  const article = await fetch(json.article)
  const html = await article.text()
  const $ = cheerio.load(html)
  const parsed = parser.parseHTML($)
  await parser.writeHTML(parsed)
  const instance = await phantom.create(['--web-security=no', '--local-to-remote-url-access=yes'])
  const page = await instance.createPage()
  await page.property('viewportSize', { width: 600, height: 800 })
  await page.property('paperSize',{format: 'A3', orientation: 'portrait'})
  await page.on('onResourceError',(err) => {
      console.log(err)
  })
  await page.on('onResourceReceived', (asd) => {
    console.log(asd)
  })
  await page.open('something.html')
  await page.render('2.pdf')
  console.log('done')
  instance.exit()
  res.send({'res':'Done'})
  let file = fs.readFileSync('2.pdf')
  file = await ipfs.add(file)
  console.log('added file: '+file)

})

server.listen(3001,'0.0.0.0', () => console.log('on!'));
