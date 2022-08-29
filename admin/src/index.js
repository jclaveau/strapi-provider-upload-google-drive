import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import { getTradObject } from './translations';

const name = pluginPkg.strapi.displayName;

export default {
  register(app) {
    app.createSettingSection(
      {
        id: pluginId,
        intlLabel: getTradObject('pages.settings.section.title', name),
      },
      [
        {
          intlLabel: getTradObject('pages.settings.section.subtitle', 'Configuration'),
          id: 'navigation',
          to: `/settings/${pluginId}`,
          Component: async () => {
            const component = await import(
              /* webpackChunkName: "navigation-settings" */ './pages/SettingsPage'
            );

            return component;
          },
        }
      ],
    );
  },

  bootstrap(app) {},
  async registerTrads({ locales }) {
    const importedTrads = await Promise.all(
      locales.map(locale => {
        return import(`./translations/${locale}.json`)
          .then(({ default: data }) => {
            return {
              data: prefixPluginTranslations(data, pluginId),
              locale,
            };
          })
          .catch(() => {
            return {
              data: {},
              locale,
            };
          });
      })
    );

    return Promise.resolve(importedTrads);
  },
};
