import * as fastify from 'fastify'

interface FastifySsePluginOptions {}

export type FastifySseSendOptions = {
  idGenerator?: (chunk: string|ReadableStream|Array|Object) => string|number
  event?: (chunk: string|ReadableStream|Array|Object) => string|number
}

export const fastifySse: FastifyPlugin<FastifySsePluginOptions>

export default fastifySse

declare module 'fastify' {
  interface FastifyReply {
    /**
     * Function called when new data should be sent.
     * Call without args to terminate the connection.
     *
     * @param {string|Readable|Object} chunk The data to send. Could be a Readable Stream, a string or an Object
     * @param {Object} options Options read for the first time, and specifying idGenerator and event
     * @param {function|null} [options.idGenerator] Generate the event id
     * @param {string|function} [options.event] Generate the event name
     */
    sse: (chunk?: string|ReadableStream|Array|Object, opts?: FastifySseSendOptions) => void
  }
}
