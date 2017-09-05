const fastify = require("fastify")();
const PassThrough = require("stream").PassThrough;
const Fs = require("fs");

fastify.register(require("./index"), (err) => {
  if (err) {
    throw err;
  }
});

fastify.get("/sse", (request, reply) => {
  reply.sse("toto");

  setTimeout(() => {
    reply.sse({event: "test", data: "titi au ski"});
    reply.sse();
  });
});

fastify.route({
  method: "GET",
  url: "/sse2",
  handler: (request, reply) => {
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
  }
});

fastify.route({
  method: "GET",
  url: "/sse3",
  handler: (request, reply) => {
    reply.sse(Fs.createReadStream("./package.json"));
  }
});

fastify.get("/", function (request, reply) {
  reply.send({hello: "world"});
});

fastify.listen(3000, function (err) {
  if (err) {
    throw err;
  }
  console.log(`server listening on ${fastify.server.address().port}`);
});
