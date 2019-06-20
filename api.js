const Koa = require('koa')
const Router = require('koa-router')
const elasticsearch = require('elasticsearch')
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
  ctx.body = await client.search({
    analyzeWildcard: true,
    size: 50,
    expandWildcards: 'all',
    // index: 'blog',
    q: ctx.query.q
  })
})

app.use(router.routes())

app.listen(PORT, () => { console.log('API on port ' + PORT) })
