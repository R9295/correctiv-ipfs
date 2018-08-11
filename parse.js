const fs = require('fs')
const request = require('request-promise-native')
// function to add 'https://corrective.org' as a prefix because links in the webpage are relative
function prefixAttribute(_this, attr){
  if (_this.attr(attr)[0] == '/'){
    let url = 'https://correctiv.org'+_this.attr(attr)
    _this.attr(attr, url)
  }
}

parseLinks = ($) => {
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
  return $
}

const toB64 = async ($, element, attribute) => {
  let p = []
  $(element).each((i, elem) => {
    // this is the modified C
    p.push(
      new Promise(async (resolve, reject) => {
        const req = await request({
          url:elem.attribs[attribute],
          method: 'GET',
          encoding: null,
        })
        // Add respective data headers to B64 data,
        // TODO CLEAN THIS UP
        const _base64 =  req.toString('base64')
        if (elem.attribs[attribute].indexOf('svg') != -1){
          elem.attribs[attribute] = `data:image/svg+xml;base64,${_base64}`
        } else if (elem.attribs[attribute].indexOf('.css') != -1) {
          elem.attribs[attribute] = `data:text/css;base64,${_base64}`
        } else if (elem.attribs[attribute].indexOf('.png') != -1){
          elem.attribs.type = `image/png`
          elem.attribs[attribute] = `data:image/png;base64,${_base64}`
        } else if (elem.attribs[attribute].indexOf('.jpg') != -1 || elem.attribs[attribute].indexOf('.jpeg') != -1){
          elem.attribs.type = `image/jpeg`
          elem.attribs[attribute] = `data:image/jpeg;base64,${_base64}`
        } else {
          elem.attribs[attribute] = _base64
        }
        resolve()
      })
    )
  })
  await Promise.all(p)
}

// remove:
// all scripts
// modify all URLS by adding a prefix of the domain where needed
// remove suggested articles
// remove navbars
// remove comment form
// remove related

const removeElements = ($) => {
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
    '.callout',
    // nav
    '.nav-primary',
    '.article-body__sharing',
  ]

  to_rm.forEach(item => {
    $(item).remove()
  })
}

const rePosition = ($) => {
  $('.footer__language').attr('align', 'center')
  // cleanup links showing the URL in the pdf and add some page breaking rules
  $('head').append(

    `
      <style>
      a::after {
       content: "" !important;
      }
      .article-body__author-name {
        text-decoration: underline !important;
      }
      body{
        page-break-inside: avoid !important;
      }
      .responsive-iframe {
        font-style: italic !important;
      }
      </style>
        `
  )
  $('body').css('page-break-inside', 'avoid !imporant')
}
const handleIframe = ($) => {
  $('iframe').each(function(i, elem){
    // TODO make sure the all the iframes are wrapped in a parent container or the whole body might get deleted
    // The English translation is commented out for now, until the language of the article is acknowledged.
    //$(this).parent().replaceWith(`<p style="font-style: italic !important;">!!! MESSGE FROM THE DEVELOPER: There was a resource here which couldn't \n
    //be embedded into a PDF, <a href='${$(this).attr('src')}' style='text-decoration: underline !important;'>here is a link to it</a> !!!</p>`)
    /*
    Dort war eine Quelle welche nicht in eine PDF eingeschlossen werden kann, hier ist ein Link dazu.
    */
    $(this).parent().replaceWith(`<p style="font-style: italic !important;">! Nachricht vom Entwickler: Dort war eine Quelle welche nicht in eine PDF \n
    eingeschlossen werden kann,<a href='${$(this).attr('src')}' style='text-decoration: underline !important;'>hier ist ein Link dazu.</a> !</p>`)
    $(this).remove()
  })
}
exports.parseHTML = async ($) => {
    parseLinks($)
    handleIframe($)
    removeElements($)
    rePosition($)
    await toB64($, 'img', 'src')
    await toB64($, 'link', 'href')
    await toB64($, 'source', 'srcset')
    return $
}
exports.writeHTML = ($, id) => {
  return new Promise(async (resolve, reject) => {
    await fs.writeFileSync(`${id}.html`, Buffer.from($.html()))
    resolve()
})
}
