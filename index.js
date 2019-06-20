var Crawler = require('crawler')
const request = require('axios')
const uri = 'https://developer.axway.com'
const excludedElements = ['body', 'div', 'ui', 'script', 'style', 'head', 'html']
var c = new Crawler({
  maxConnections: 40,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error)
    } else {
      // $ is Cheerio by default
      // a lean implementation of core jQuery designed specifically for the server
    }
    done()
  }
})

// Queue URLs with custom callbacks & parameters
c.queue([
  {
    uri,
    // The global callback won't be called
    callback: function (error, res, done) {
      if (error) {
        return console.log(error)
      }
      const $ = res.$
      $('*').each((i, elem) => {
        if (!excludedElements.includes(elem.name)) {
          const rawText = $(elem).text().trim()
          const text = rawText.replace(/\s+/g, ' ')
          if (!text) {
            return
          }
          const indexObject = {
            href: uri,
            text
          }
          index(indexObject)
        }
        // let bodyContent
        // if (elem.name === 'body') {
        //   const rawBodyContent = $(elem)
        //     .text()
        //     .trim()
        //   bodyContent = rawBodyContent.replace(/\s+/g, ' ')
        //   const indexObject = {
        //     href: uri,
        //     text: bodyContent
        //   }
        //   index(indexObject)
        // }
        if (elem.name === 'a') {
          const href = $(elem).attr('href')
          const title = $(elem).text()
          const regExUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/
          if (!regExUrl.test(href)) {
            return
            // TODO: maybe a link with the same domain
          }
          const indexObject = {
            href,
            text: title
          }
          index(indexObject)
        }
      })
      done()
    }
  }
])

const index = (data) => {
  request
    .post('http://127.0.0.1:9200/developer/_doc', data)
    .then(res => console.log(res))
    .catch(error => console.log(error))
}
