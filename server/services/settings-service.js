'use strict';
const pluginId = require('../../admin/src/pluginId')

const STORE_KEY = 'settings'

const getPluginConfig = async () => {

  const service = await strapi
    .plugin(pluginId)
    .service('config')

  const config = service.get()

  return config
}

module.exports = {
  getPluginConfig,
  async get() {

    const store = await strapi.store({ type: 'plugin', name: pluginId });

    const settings = {
      ...await store.get({ key: STORE_KEY })
    }

    const pluginConfig = await getPluginConfig()
    for (const pluginConfigEntry in pluginConfig) {
      settings[pluginConfigEntry] = pluginConfig[pluginConfigEntry]
      settings[`${pluginConfigEntry}_fromConfig`] = true
    }

    return settings;
  },

  async set(settings) {
    const store = await strapi.store({ type: 'plugin', name: pluginId });

    // Config entries must not be saved in the store as a setting
    const pluginConfig = await getPluginConfig()
    for (const pluginConfigEntry in pluginConfig) {
      if (settings[`${pluginConfigEntry}_fromConfig`]) {
        delete(settings[pluginConfigEntry])
        delete(settings[`${pluginConfigEntry}_fromConfig`])
      }
    }

    await store.set({
      key: STORE_KEY,
      value: settings,
    });

    return 'settings saved'
  }
}
