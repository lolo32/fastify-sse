/* eslint-disable no-confusing-arrow */

"use strict";

const fastifySse = require("../index");

const fastifyModule = require("fastify");
const test = require("tap").test;
const request = require("request");

test("reply.sse exists", (tap) => {
  tap.plan(7);

  const data = {hello: "world"};

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  fastify.get("/", (request, reply) => {
    tap.ok(reply.sse);
    reply.send(data);
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-length"], `${body.length}`);
      tap.deepEqual(JSON.parse(body), data);
      fastify.close();
    });
  });
});
