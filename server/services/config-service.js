'use strict';
const pluginId = require('../../admin/src/pluginId')

module.exports = {
  async get() {
    const store = await strapi.store({ type: 'plugin', name: pluginId });

    const config = {
      clientId: '',
      clientSecret: '',
      tokenInfo: '',
      ...await store.get({ key: 'config' })
    }

    // console.log('config service: config', config)
    return config;
  },

  async set(value) {
    const store = await strapi.store({ type: 'plugin', name: pluginId });
    await store.set({
      key: 'config',
      value
    });

    return 'config saved'
  }
}
