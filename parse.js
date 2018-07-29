const fs = require('fs')
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
    //'.article-body__main',
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
       text-decoration: underline !important;
      }
      body{
        page-break-inside: avoid !important;
      }
      </style>
        `
  )
  $('body').css('page-break-inside', 'avoid !imporant')
}
const handleIframe = ($) => {
  $('iframe').each(function(i, elem){
    // TODO make sure the all the iframes are wrapped in a parent container or the whole body might get deleted
    $(this).parent().replaceWith(`!!! MESSGE FROM THE DEVELOPER: There was a resource here which couldn't \n
    be embedded into a PDF, <a href='${$(this).attr('src')}' style='text-decoration: underline !important;'>here is a link to it</a<`)
    $(this).remove()
  })
}
exports.parseHTML = ($) => {
    parseLinks($)
    handleIframe($)
    removeElements($)
    rePosition($)
    return $
}
exports.writeHTML = ($) => {
  return new Promise(async (resolve, reject) => {
    await fs.writeFileSync('something.html', Buffer.from($.html()))
    resolve()
})
}
