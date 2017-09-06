/* eslint-disable no-confusing-arrow */

"use strict";

const fastifySse = require("../index");

const fastifyModule = require("fastify");
const test = require("tap").test;
const request = require("request");
const PassThrough = require("stream").PassThrough;

test("reply.sse could send Readable stream in object mode", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = {hello: "world"};

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass);
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `id: 1\r\ndata: ${JSON.stringify(data)}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

test("reply.sse could send Readable stream in byte mode", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = "hello: world";

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: false});
    reply.sse(pass);
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `id: 1\r\ndata: ${data}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

test("reply.sse with streams can generate id", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = {hello: "world", num: 4};

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass, {idGenerator: (event) => event ? event.num * 5 : undefined});
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `id: ${4 * 5}\r\ndata: ${JSON.stringify(data)}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

test("reply.sse with streams can ignore id", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = {hello: "world", num: 4};

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass, {idGenerator: null});
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `data: ${JSON.stringify(data)}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

test("reply.sse with streams can specify static events", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = {hello: "world", num: 4};

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass, {event: "test"});
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `id: 1\r\nevent: test\r\ndata: ${JSON.stringify(data)}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

test("reply.sse with streams can generate dynamic events", (tap) => {
  tap.plan(7);

  const fastify = fastifyModule();
  fastify.register(fastifySse, (err) => {
    tap.error(err);
  });

  const data = {hello: "world", name: "test function"};

  fastify.get("/", (request, reply) => {
    const pass = new PassThrough({objectMode: true});
    reply.sse(pass, {event: (event) => event ? event.name : undefined});
    pass.write(data);
    pass.end();
  });

  fastify.listen(0, (err) => {
    tap.error(err);

    request({
      method: "GET",
      uri: `http://localhost:${fastify.server.address().port}`
    }, (err, response, body) => {
      tap.error(err);
      tap.strictEqual(response.statusCode, 200);
      tap.strictEqual(response.headers["content-type"], "text/event-stream");
      tap.strictEqual(response.headers["content-encoding"], "identity");
      tap.equal(body, `id: 1\r\nevent: test function\r\ndata: ${JSON.stringify(data)}\r\n\r\nevent: end\r\ndata: \r\n\r\n`);
      fastify.close();
    });
  });
});

