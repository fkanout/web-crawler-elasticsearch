const Koa = require('koa')
const Router = require('koa-router')
const elasticsearch = require('elasticsearch')
const cors = require('@koa/cors')
const app = new Koa()
const router = new Router()
const elasticInstance = 'http://127.0.0.1:9200'
const client = new elasticsearch.Client({
  host: elasticInstance
})
const PORT = 3000
router.delete('/index/:indexName', async (ctx, next) => {
  ctx.body = await client.indices.delete({ index: ctx.params.indexName })
  await next()
})

router.get('/doc', async (ctx, next) => {
  const indices = ctx.query.indices.split(',')
  const reqToResolve = indices.map(index =>
    client.search({
      size: 10,
      index: index,
      body: {
        'query': {
          'wildcard': {
            'text': {
              'value': `*${ctx.query.q}*`
            }
          }
        }

      }
    }))

  const res = await Promise.all(reqToResolve)

  ctx.body = res.map(ele => {
    if (ele.hits && ele.hits.hits.length > 0) {
      const hashName = ele.hits.hits[0]._index
      return ({
        [hashName]: ele.hits.hits
      })
    } else {
      return []
    }
  })
  await next()
})
app.use(cors())

app.use(router.routes())

app.listen(PORT, () => { console.log('API on port ' + PORT) })
