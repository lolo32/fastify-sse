"use strict";

/*
 * Based on https://github.com/mtharrison/susie
 */

const FastifyPlugin = require("fastify-plugin");
const Stream = require("stream");
const SafeStringify = require("fast-safe-stringify");
const PassThrough = Stream.PassThrough;
const Readable = Stream.Readable;
const Transform = Stream.Transform;

const endl = "\r\n";

/**
 * Convert an object
 *
 * @param {Object} event
 * @param {string} [event.event]
 * @param {string} [event.id]
 * @param {Object|Buffer|string} event.data
 * @return {string}
 */
const stringifyEvent = (event) => {
  let ret = "";

  for (const key of ["id", "event", "data"]) {
    if (event.hasOwnProperty(key)) {
      let value = event[key];
      if (value instanceof Buffer) {
        value = value.toString();
      }
      if ("object" === typeof value) {
        value = SafeStringify(value);
      }
      ret += key + ": " + value + endl;
    }
  }

  return ret + endl;
};

/**
 * Write a string to the Stream
 *
 * @param {string|null} event
 * @param {string|Buffer|Object|null} event.data
 * @param {PassThrough} stream
 * @param {function} stream.write
 * @param {function} stream.end
 */
const writeEvent = (event, stream) => {
  if (event.data) {
    stream.write(stringifyEvent(event));
  } else {
    stream.write(stringifyEvent({event: "end", data: ""}));
    stream.end();
  }
};

/**
 *
 * @param {Object} self
 * @param {Object} options
 * @param {function} idGenerator
 */
const initOptions = (self, options, idGenerator) => {
  if (null !== options.idGenerator) {
    self.idGenerator = options.idGenerator || idGenerator;
  }
  if ("function" !== typeof self.idGenerator && null !== options.idGenerator) {
    throw new Error("Option idGenerator must be a function or null");
  }

  switch (typeof options.event) {
    case "function":
      self.eventGenerator = true;
    case "string":
      self.event = options.event;
      break;

    default:
      self.event = null;
  }
};

/**
 * Class in charge of converting a stream (in object mode or not) to an object with keys event, id and data
 *
 * @param {Object} options
 * @param {function} [options.idGenerator]
 * @param {function|string} [options.event]
 * @param {boolean} [options.objectMode = false] Is this stream work accept object in input?
 * @constructor
 */
class EventTransform extends Transform {
  constructor(options, objectMode) {
    super({objectMode});

    options = options || {};

    const idGenerator = () => this.id += 1;

    this.id = 0;
    initOptions(this, options, idGenerator);
  }

  /**
   * Do no call this, it's internal Stream transform function
   * @param chunk
   * @param encoding
   * @param callback
   * @private
   */
  _transform(chunk, encoding, callback) {
    const event = {};

    if (this.idGenerator) {
      event.id = this.idGenerator(chunk);
    }
    if (this.event) {
      event.event = this.eventGenerator ? this.event(chunk) : this.event;
    }
    event.data = chunk;

    this.push(stringifyEvent(event));

    callback();
  }

  /**
   * Do no call this, it's internal Stream transform function
   * @param callback
   * @private
   */
  _flush(callback) {
    this.push(stringifyEvent({event: "end", data: ""}));

    callback();
  }
}

/**
 * Decorators
 *
 * @param {fastify} instance
 * @param {function} instance.decorate
 * @param {function} instance.decorateReply
 * @param {Object} instance.sse
 * @param {Object} opts
 * @param {function} next
 */
module.exports = FastifyPlugin((instance, opts, next) => {

  instance.decorateReply("sse",
      /**
       * Function called when new data should be send
       *
       * @param {string|Readable|Object} chunk
       * @param {Object} options
       * @param {function} [options.idGenerator]
       * @param {string|function} [options.event]
       */
      function (chunk, options) {
        let stream;

        const send = (stream) => {
          this.type("text/event-stream")
              .header("content-encoding", "identity")
              .send(stream);
        };

        const sse = this.res.sse = this.res.sse || {id: 0};

        if (chunk instanceof Readable) {
          // handle a stream arg

          sse.mode = "stream";

          if (chunk._readableState.objectMode) {
            // Input stream is in object mode, so pipe the input to the passthrough then to the transform

            const through = new EventTransform(options, true);
            stream = new PassThrough();
            through.pipe(stream);
            chunk.pipe(through);
          } else {
            // Input is not in object mode, so pipe the input to the transform

            stream = new EventTransform(options, false);
            chunk.pipe(stream);
          }

          send(stream);
          return;
        }

        // handle a first object arg

        if (!sse.stream) {
          options = options || {};
          const idGenerator = () => sse.id += 1;

          stream = new PassThrough();
          sse.stream = stream;
          sse.mode = "object";

          initOptions(sse, options, idGenerator);

          send(stream);
        } else {
          // already have an object stream flowing, just write next event
          stream = sse.stream;
        }

        const event = {};
        if (sse.idGenerator) {
          event.id = sse.idGenerator(chunk);
        }

        if (sse.event) {
          event.event = sse.eventGenerator ? sse.event(chunk) : sse.event;
        }
        event.data = chunk;

        writeEvent(event, stream);
      });

  next();
}, "0.x");
