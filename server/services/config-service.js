'use strict';

const uploadPluginId = 'upload'

module.exports = ({ strapi }) => {
  return {
    get(key=null) {

      const providerConfig = {
        displayConfigInSettings: false,
        dumpSettings: strapi.config.environment == 'production'
          ? false
          : strapi.plugin(uploadPluginId).config('dumpSettings'),
        ...strapi.plugin(uploadPluginId).config('providerOptions')
      }

      return key
        ? providerConfig[key]
        : providerConfig
    },
  };
};