#!/usr/bin/env node

const [, , ...args] = process.argv
const Crawler = require('crawler')
const request = require('axios')
const chalk = require('chalk')
const elasticsearch = require('elasticsearch')
const excludedElements = ['body', 'div', 'ui', 'script', 'style', 'head', 'html']
const portals = []
let created = 0
let elasticInstance = 'http://127.0.0.1:9200'

args.forEach(arg => {
  if (arg === '-e' || arg === '--elastic') {
    const elasticArgIndex = args.indexOf(arg)
    elasticInstance = args[elasticArgIndex + 1]
  } else {
    try {
      const currentArgIndex = args.indexOf(arg)
      if (args[currentArgIndex - 1] === '-e' || args[currentArgIndex - 1] === '--elastic') {
        return
      }
      const argAsArray = arg.split(':')
      const portalUrl = new URL(argAsArray[0] + ':' + argAsArray[1])
      portals.push({
        url: portalUrl.origin,
        name: argAsArray[2] || portalUrl.host
      })
    } catch (error) {
      console.log(error)
    }
  }
})

const client = new elasticsearch.Client({
  host: elasticInstance
})

client.ping({
  // ping usually has a 3000ms timeout
  requestTimeout: 1000
}, function (error) {
  if (error) {
    console.trace('elasticsearch cluster is down!')
  } else {
    console.log('All is well')
  }
})

const c = new Crawler({
  maxConnections: 1,
  // This will be called for each crawled page
  callback: function (error, res, done) {
    if (error) {
      console.log(error)
    } else {
      console.log(created)

      // $ is Cheerio by default
      // a lean implementation of core jQuery designed specifically for the server
    }
    console.log(created)

    done()
  }
})

const core = async (url, name) => {
  if (await client.indices.exists({ index: name })) {
    await client.indices.delete({ index: name })
  }
  c.queue([{
    url,
    callback: async function (error, res, done) {
      if (error) {
        return console.log(error)
      }
      const $ = res.$
      const elementToAdd = []
      $('*').each((i, elem) => {
        if (!excludedElements.includes(elem.name)) {
          const rawText = $(elem).text().trim()
          const text = rawText.replace(/\s+/g, ' ')
          if (!text) {
            return
          }
          const prefixIndex = {
            index: { _index: name, _type: '_doc' }
          }
          const indexObject = {
            href: url,
            text
          }
          elementToAdd.push(prefixIndex, indexObject)
        }
        if (elem.name === 'a') {
          const href = $(elem).attr('href')
          const title = $(elem).text()
          const regExUrl = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/
          if (!regExUrl.test(href)) {
            return
            // TODO: maybe a link with the same domain
          }
          const prefixIndex = {
            index: { _index: name, _type: '_doc' }
          }

          const indexObject = {
            href,
            text: title

          }
          elementToAdd.push(prefixIndex, indexObject)
        }
      })

      try {
        const { items } = await client.bulk({
          body: elementToAdd
        })
        console.log(`From ${chalk.red(url)} indexed ${chalk.yellow(items.length)} name ${chalk.green(name)}`)
      } catch (error) {
        console.log(error)
      }
      done()
    }
  }])
}
portals.forEach(({ url, name }) => {
  try {
    core(url, name)
  } catch (error) {
    console.log(error)
  }
})
