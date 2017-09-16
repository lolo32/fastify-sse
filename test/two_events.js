/* eslint-disable no-confusing-arrow */

"use strict";

const fastifySse = require("../index");

const fastifyModule = require("fastify");
const PassThrough = require("stream").PassThrough;
const request = require("request");
const test = require("tap").test;

test("reply.sse reply to 2 SSE simultaneously", (t) => {
  t.plan(12);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    t.error(err);
  });

  const data = "hello: world";

  fastify.get("/", (request, reply) => {
    reply.sse(data);
    reply.sse();
  });

  fastify.get("/stream", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass);
    pass.write({data});
    pass.end();
  });

  fastify.listen(0, (err) => {
    t.error(err);

    let nbSse = 2;

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      t.error(err);
      t.strictEqual(response.statusCode, 200);
      t.strictEqual(response.headers["content-type"], "text/event-stream");
      t.strictEqual(response.headers["content-encoding"], "identity");
      t.equal(body, `id: 1\r\ndata: ${data}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      nbSse -= 1;
      if (0 === nbSse) {
        t.end();
        fastify.close();
      }
    });

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}/stream`
    }, (err, response, body) => {
      t.error(err);
      t.strictEqual(response.statusCode, 200);
      t.strictEqual(response.headers["content-type"], "text/event-stream");
      t.strictEqual(response.headers["content-encoding"], "identity");
      t.equal(body, `id: 1\r\ndata: ${JSON.stringify({data})}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      nbSse -= 1;
      if (0 === nbSse) {
        t.end();
        fastify.close();
      }
    });
  });
});
