const wkhtmltopdf = require('wkhtmltopdf');
const cheerio = require('cheerio')
const fetch = require('node-fetch')
const fs = require('fs')

const html = fs.readFileSync('article3.html').toString()
const $ = cheerio.load(html)

// function to add 'https://corrective.org' as a prefix because links in the webpage are relative
function prefixAttribute(_this, attr){
  if (_this.attr(attr)[0] == '/'){
    let url = 'https://correctiv.org'+_this.attr(attr)
    _this.attr(attr, url)
  }
}

// begin parsing the article
// remove:
// all scripts
// modify all URLS by adding a prefix of the domain where needed
// remove suggested articles
// remove navbars
// remove comment form
// remove related

$('a').each(function(i, elem){
  let _this = $(this)
  prefixAttribute(_this, 'href')
})
$('img').each(function(i, elem){
  _this = $(this)
  prefixAttribute(_this, 'src')
})
$('source').each(function(i, elem){
  _this = $(this)
  prefixAttribute(_this, 'srcset')
})

$('link').each(function(i, elem){
  _this = $(this)
  prefixAttribute(_this, 'href')
})


// remove all scripts and noscript tags
$('script').each(function(i, elem){
  $(this).remove()
})
$('noscript').each(function(i, elem){
  $(this).remove()
})

// remove all navbars
$('nav').each(function(i, elem){
  $(this).remove()
})
$('.nav-primary').remove()

// remove all forms
$('form').each(function(i, elem){
  $(this).remove()
})

// individual elements to remove
const to_rm = [
  // remove footer meta
  '.footer__meta',
  // remove suggested articles
  '.article-body__calltoaction',
  // remove login link
  '.footer__account-login',
  // promo banner
  '.promo-banner',
  // comments
  '#comment-list',
  '.article-footer__header',
  // remove call out
  '.callout'
]

to_rm.forEach(item => {
  $(item).remove()
})



$('.footer__language').attr('align', 'center')

// cleanup links showing the URL in the pdf and add some page breaking rules
$('head').append(
  `
    <style>
    a::after {
     content: "" !important;
     text-decoration: underline !important;
    }
    body{
      page-break-inside: avoid !important;
    }
    </style>
      `
)
$('body').css('page-break-inside', 'avoid !imporant')


const write = () => {
  return new Promise(async (resolve, reject) => {
    await fs.writeFileSync('something.html', Buffer.from($.html()))
    resolve(123)
  });
}

write().then(data => {
  var stream = wkhtmltopdf(fs.createReadStream('something.html'), {logLevel: 'error'}).pipe(fs.createWriteStream('out.pdf'))
})
