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

const toB64 = async ($, element, attribute, target) => {
  let p = []
  // allowed extensions
  const allowed = {
    'css': {
      data_attr:'data:text/css;base64, '
      },
     'svg': {
       data_attr:'data:image/svg+xml;base64, '
      },
    'png': {
      data_attr:'data:image/png;base64, ',
      attr_type:'image/png'
    },
    'jpg': {
      data_attr:'data:image/jpeg;base64, ',
      attr_type:'image/jpeg'
    },
    'jpeg': {
      data_attr:'data:image/jpeg;base64, ',
      attr_type:'image/jpeg'
    },

    'gif': {
      data_attr:'data:image/gif;base64, ',
      attr_type:'image/gif'
    },

  }
  $(element).each((i, elem) => {
    // this is the modified C
    // TODO
    // check if this file is allowed to be converted
    const fileType = elem.attribs[attribute].split('.').pop()
    if (allowed.hasOwnProperty(fileType)){
    p.push(
      new Promise(async (resolve, reject) => {
        const req = await request({
          url:elem.attribs[attribute],
          method: 'GET',
          encoding: null,
        })
        // TODO check GIF bug
        // Add respective data headers to B64 data,
        let _base64 =  `${allowed[fileType].data_attr}${req.toString('base64')}`
        // add attr type if needed(images need this in <source>)
        if (allowed[fileType].hasOwnProperty('attr_type')){
          elem.attribs.type = allowed[fileType].attr_type
        }
        // set target for lazy loading
        if (target){
          elem.attribs[target] = _base64
          elem.attribs[attribute] = '#'
        }
          resolve()
      })
    )
  }
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
const handleLazyImages = ($) => {

  $('body').append(
  `
  <script>
    window.addEventListener("load", function(){
    var imgs = document.querySelectorAll('[lsrc]')
    console.log(1)
    imgs.forEach(function(item){
      item.onload = function() {
        item.removeAttribute('lsrc');
      }
      if (item.srcset){
        item.setAttribute('srcset', item.getAttribute('lsrc'))
        } else {
        item.setAttribute('src', item.getAttribute('lsrc'))
      }
    })
    })
  </script>
  `
  )
}
exports.parseHTML = async ($) => {
    parseLinks($)
    handleIframe($)
    removeElements($)
    rePosition($)
    // setting target to allow lazy loading images
    // has to be lsrc, if needed to change, change the value in handleLazyImages
    await toB64($, 'img', 'src', 'lsrc')
    await toB64($, 'link', 'href')
    await toB64($, 'source', 'srcset', 'lsrc')
    handleLazyImages($)
    return $
}
exports.writeHTML = ($, id) => {
  return new Promise(async (resolve, reject) => {
    await fs.writeFileSync(`${id}.html`, Buffer.from($.html()))
    resolve()
})
}
