const phantom = require('phantom')
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')
const Parser = require('rss-parser');
const IPFS = require('ipfs-api')
const parser = require('./parse')

let rssParser = new Parser();
const ipfs = IPFS('127.0.0.1', '5001',{protocol:'http'})


const sm = () => {
  return new Promise(async (resolve, reject) => {
    const feed = await rssParser.parseURL('https://correctiv.org/artikel/feeds/')
    const keys = Object.keys(feed.items[0])
    resolve(feed.items[0].link)

  })

  // reverse to get oldest first
  //feed.items.reverse().forEach(item => {
    // /console.log(item.title + ':' + item.link)
  //});
}
sm().then(async(article) => {
  const res = await fetch(article)
  const html = await res.text()
  console.log(html)
  const $ = cheerio.load(html)
  parser.parseHTML($)
  parser.writeHTML($).then(data => {
    // create PDF
    phantom.create().then(instance => {
      instance.createPage().then(async(page) => {
        await page.property('viewportSize', { width: 600, height: 800 })
        await page.property('paperSize',{format: 'A3', orientation: 'portrait'})
        //const _ = await fs.readFileSync('./something.html').toString()
        await page.open('./something.html')
        await page.render('out.pdf')
        instance.exit()
      })
    })
  })
})
