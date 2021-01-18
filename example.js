"use strict";

const fastify = require("fastify")({ logger: true });
const PassThrough = require("stream").PassThrough;
const Fs = require("fs");

fastify.register(require("./index.js"), {}, (err) => {
  console.log('error loading plugin')
  if (err) {
    throw err;
  }
});

fastify.get("/sse", (request, reply) => {
  reply.sse("toto");

  setTimeout(() => {
    reply.sse({data: "titi au ski", event: "test"});
    reply.sse();
  }, 500);
});

fastify.get("/sse2", (request, reply) => {
    const read = new PassThrough({objectMode: true});
    let index = 0;

    reply.sse(read);

    const id = setInterval(() => {
      read.write({event: "test", index});

      index += 1;

      if (!(index % 10)) {
        read.end();
        clearInterval(id);
      }
    }, 1000);
  });

fastify.route({
  handler: (request, reply) => {
    reply.sse(Fs.createReadStream("./package.json"));
  },
  method: "GET",
  url: "/sse3"
});

fastify.route({
  method: "GET",
  url: "/sse-hapi",
  handler: (request, reply) => {
    let index = 0;
    const options = {};

    const cleanUp = () => {
      fastify.log.info('cleaning up interval after disconnect')
      clearInterval(interval)
    }

    // Send the first data
    reply.sse("sample data", options);

    // Handle client disconnect event
    request.socket.on('close', cleanUp)

    // Send a new data every seconds for 10 seconds then close
    const interval = setInterval(() => {
      index += 1
      reply.sse({event: "test", data: index});
      if (!(index % 10)) {
        reply.sse();
      }
    }, 1000);
  }
});

fastify.get("/", (request, reply) => {
  reply.send({hello: "world"});
});


fastify.listen(3000, (err) => {
  if (err) {
    console.log('error')
    throw err;
  }
  console.log(`server listening on ${fastify.server.address().port}`);
});
