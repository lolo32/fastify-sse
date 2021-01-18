import { FastifyPlugin } from 'fastify'
import { Readable } from 'stream'

interface FastifySsePluginOptions {}

export type FastifySseSendOptions<T> = {
  idGenerator?: (chunk: T) => string
  event?: (chunk: T) => string
}

export type FastifySsePayload = {
  id?: string
  event?: string
  data?: Buffer|string|Readable|Object|null
}

export const fastifySse: FastifyPlugin<FastifySsePluginOptions>

export default fastifySse

declare module 'fastify' {
  interface FastifyReply {
    /**
     * Function called when new data should be sent.
     * Call without args to terminate the connection.
     *
     * @param {Buffer|string|Readable|Object} chunk The data to send. Could be a Readable Stream, a string or an Object
     * @param {Object} options Options read for the first time, and specifying idGenerator and event
     * @param {function|null} [options.idGenerator] Generate the event id
     * @param {string|function} [options.event] Generate the event name
     */
    sse: <T = FastifySsePayload|Buffer|string|Readable|Object>(chunk?: T, opts?: FastifySseSendOptions<T>) => void
  }
}
