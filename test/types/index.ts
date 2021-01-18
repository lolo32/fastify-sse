import { randomBytes } from 'crypto'
import fastify from 'fastify'
import sse from '../../'

const app = fastify()

app
  .register(sse, {})
  .after(() => {
    app.get('/', (request, reply) => {
      // Send a payload
      reply.sse({
        event: 'sse-test',
        data: {
          hello: 'world'
        }
      })

      // Close the connection
      reply.sse()
    })

    app.get('/string', (request, reply) => {
      reply.sse('hello, world')
      reply.sse()
    })

    app.get('/options', (request, reply) => {
      reply.sse(Buffer.from('abc:some data'), {
        event: (data) => {
          return data.toString().split(':')[0]
        },
        idGenerator: () => randomBytes(8).toString('hex')
      })

      reply.sse()
    })
  })
