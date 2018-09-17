/*
 * The MIT License (MIT)
 *
 */

'use strict';

const _ = require('lodash');
const swaggerTools = require('swagger-tools');
const validate = require('jsonschema').validate;
const debug = require('debug')('koa2-swagger-metadata');

exports = module.exports = async function () {
  debug('Initializing koa2-swagger-metadata');

  const generateMetadata = () => {
    return new Promise((resolve, reject) => {
      swaggerTools.initializeMiddleware(...arguments, function ({swaggerMetadata}) {
        resolve(swaggerMetadata());
      });
    });
  };
  const metadata = await generateMetadata();

  const parseMetadata = ctx => {
    return new Promise((resolve, reject) => {
      metadata(ctx.req, ctx.res, err => err ? reject(err) : resolve());
    });
  };

  const swaggerMetadata = async function (ctx, next) {
    debug('Parse metadata');
    await parseMetadata(ctx);

    if (ctx.req.swagger) {
      debug('Parsed params', ctx.req.swagger.params);
      ctx.swagger = ctx.req.swagger;
      delete ctx.req.swagger;
    }

    await next();
  };

  const metadataValidator = async function (ctx, next) {
    debug('Validate metadata');
    const {swagger} = ctx;

    // skip validate since params not exist
    if (!(swagger && swagger.params)) {
      return await next();
    }

    // validate params
    _.forEach(swagger.params, (param, paramName) => {
      const {value, schema} = param;
      const valid = validate(value, schema.schema || schema);
      if (!valid.valid) {
        debug('Validate failed');
        debug(paramName, param, valid);

        const err = valid.errors[0];
        err.property = err.property.replace('instance', paramName);
        throw err;
      }
    });
    debug('Validate success');
    await next();
  };

  return {
    swaggerMetadata,
    metadataValidator
  };
};
