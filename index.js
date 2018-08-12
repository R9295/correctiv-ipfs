const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const IPFS = require('ipfs-api')
const parser = require('./parse')
const express = require('express')
const nanoid = require('nanoid')
const ipfs = IPFS('127.0.0.1', '5001',{protocol:'http'})
const server = express()

server.use(express.json())

server.get('/', (req, res) => {
  res.send({hello:'world'})
})
server.post('/api/v0/add', async (req, res) => {
  const json = req.body
  const article_id = nanoid()
  const article = await fetch(json.article)
  const html = await article.text()
  const $ = cheerio.load(html)
  const parsed = await parser.parseHTML($)
  await parser.writeHTML($, article_id)
  const _ = fs.readFileSync(`${article_id}.html`)
  res.send({'res':article_id})
  let file = fs.readFileSync(`${article_id}.html`)
  file = await ipfs.add(file)
  console.log(`added file: ${article_id}.html. Hash is ${file[0].hash}`)
})

server.listen(3001,'0.0.0.0', () => console.log('on!'));
