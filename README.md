# WIP strapi-provider-upload-google-drive
Store your Strapi uploads on Google Drive

[![Install](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/install.yml/badge.svg)](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/install.yml)
[![Audit](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/audit.yml/badge.svg)](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/audit.yml)
[![e2e Tests](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/playwright.yml/badge.svg)](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/playwright.yml)

This plugin is meant to store the content of your medialibrary on Google Drive. While accessed those files are copied locally
to avoid massive slow calls on the Google Drive API. This allows to spawn Strapi instances not having persistent storage for free.

### Features
+ Settings page to configure your OAuth credentials easily
+ Google Drive target folder based on variables
+ Passing credentials through env variables
+ If you stop using this plugin, all your uploads will continue to work with the default `upload-local` provider as long as they are cached locally (by default in `/uploads/drive`)

### TODO
+ Most required: e2e tests!
+ Better config/Settings for cache folder, maxAge...
+ Switch to ESM?
+ Other translations
+ [Look at the issues!](https://github.com/jclaveau/strapi-provider-upload-google-drive/issues)

### Usage
```
yarn add git:https://github.com/jclaveau/strapi-provider-upload-google-drive.git
```
(Npm package will come once ready)

Update your `config/plugins.js` to look like:
```js
module.exports = ({ env }) => {
  return {
    'upload-google-drive': {
      enabled: true,
    },
    upload: {
      config: {
        provider: 'strapi-provider-upload-google-drive',
      },
    },
  }
}
```

And add the following middleware at the end of your `config/middlewares.js`:
```js
  'plugin::upload-google-drive.uploadsPath',
```

Then go to your admin `panel > setting > Uploads` on Google Drive and follow the steps to populate the fields.

### OAuth credentials from env
Each setting can be defined in the provider options so they can't be changed/seen in the settings page.
```js
module.exports = ({ env }) => {
  return {
    'upload-google-drive': {
      enabled: true,
    },
    upload: {
      config: {
        provider: 'strapi-provider-upload-google-drive',
        providerOptions: {
          // All those options are optional
          dumpSettings: true,                               // Dumps current effective settings
          displayConfigInSettings: true,                    // Do not hide settings defined in the provider configuration

          clientId: env('GOOGLE_OAUTH_CLIENT_ID'),          // Google OAuth client's id
          clientSecret: env('GOOGLE_OAUTH_CLIENT_SECRET'),  // Google OAuth client's secret
          tokens: env('GOOGLE_OAUTH_CLIENT_TOKENS'),        // Google OAuth tokens
          driveFolderPattern: '/target_folder_on_drive',    // Folder
        },
      },
    },
  }
}
```

### This plugin saved you some time and money?
[Buy me a coffee ;) ](https://www.buymeacoffee.com/jeanclaveau)