"use strict";

const FastifySse = require("../index");

const Fastify = require("fastify");
const test = require("tap").test;
const Request = require("request");

test("reply.sse exists", t => {
  t.plan(7);

  const data = {hello: "world"};

  const fastify = Fastify();
  fastify.register(FastifySse, (err) => {
    t.error(err);
  });

  fastify.get("/", (request, reply) => {
    t.ok(reply.sse);
    reply.send(data);
  });

  fastify.listen(0, (err) => {
    t.error(err);

    Request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      t.error(err);
      t.strictEqual(response.statusCode, 200);
      t.strictEqual(response.headers["content-length"], `${body.length}`);
      t.deepEqual(JSON.parse(body), data);
      fastify.close();
    });
  });
});
