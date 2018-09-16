/*
 * The MIT License (MIT)
 *
 */

'use strict';

const swaggerTools = require('swagger-tools');
const debug = require('debug')('koa2-swagger-metadata');

exports = module.exports = async function (swaggerDoc) {
  debug('Initializing koa2-swagger-metadata');

  const generateMetadata = function () {
    return new Promise((resolve, reject) => {
      swaggerTools.initializeMiddleware(swaggerDoc, function ({swaggerMetadata}) {
        resolve(swaggerMetadata());
      });
    });
  };
  const metadata = await generateMetadata();

  const parseMetadata = function (ctx) {
    return new Promise((resolve, reject) => {
      metadata(ctx.req, ctx.res, err => err ? reject(err) : resolve());
    });
  };

  return async function swaggerMetadata (ctx, next) {
    await parseMetadata(ctx);

    if (ctx.req.swagger) {
      ctx.swagger = ctx.req.swagger;
    }
    await next();
  };
};
