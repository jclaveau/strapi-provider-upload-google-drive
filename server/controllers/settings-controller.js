'use strict';
const pluginId = require('../../admin/src/pluginId')

module.exports = {
  getService() {
    return strapi
      .plugin(pluginId)
      .service('settings')
  },
  async get(ctx) {
    const settings = await this.getService().get()

    if (! settings[`displayConfigInSettings`]) {
      for (const entry of [
        'clientId',
        'clientSecret',
        'driveFolderPattern',
      ]) {
        if (settings[`${entry}_fromConfig`]) {
          settings[entry] = '•••••••••••••'
        }
      }

      if (settings[`tokens`]) {
        settings.tokens.access_token = '•••••••••••••'
        settings.tokens.refresh_token = '•••••••••••••'
      }
    }

    return settings
  },
  async put(ctx) {
    const body = ctx.request.body;
    const settings = await this.getService().get()

    const newSettings = {
      ...settings,
      ...body,
    }

    await this.getService().set(newSettings);

    return newSettings
  },
};
