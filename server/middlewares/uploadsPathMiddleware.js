'use strict';

const pluginId = require('../../admin/src/pluginId')
// const { defaultsDeep } = require('lodash/fp');
const url = require('url');
const path = require('path');

module.exports = (options, { strapi }) => {
  // const { defaultIndex, maxAge } = defaultsDeep(defaults, config);

  return async (ctx, next) => {
    // This middleware redirects assets stored in /uploads/drive to /upload-google-drive/file/:filename
    // If you disable the upload-google-drive plugin, the default upload provider will work

    const requestUrl = url.parse(ctx.url, true);
    const requestPath = path.parse(requestUrl.pathname, true);

    const driveSettings = await strapi.plugin(pluginId).service('settings').get();
    if (requestPath.dir != `/uploads${driveSettings.localUploadFolder}`) {
      return await next()
    }

    const pathBefore = ctx.path
    ctx.path = `/${pluginId}/file/${requestPath.name}${requestPath.ext}`
    await next()
    ctx.path = pathBefore
  };
};