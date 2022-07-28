'use strict';
const pluginId = require('../../admin/src/pluginId')

module.exports = {
  getService() {
    return strapi
      .plugin(pluginId)
      .service('config')
  },
  async get(ctx) {
    const config = await this.getService().get()
    // console.log('Config controller: config', config)
    return config;
  },
  async put(ctx) {
    const body = ctx.request.body;
    const config = await this.getService().get()

    const newConfig = {
      ...config,
      ...body,
    }

    await this.getService().set({
      ...config,
      ...body,
    });

    return newConfig
  },
};
