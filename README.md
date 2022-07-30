# WIP strapi-provider-upload-google-drive
Store your Strapi uploads on Google Drive

[![Install](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/install.yml/badge.svg)](https://github.com/jclaveau/strapi-provider-upload-google-drive/actions/workflows/install.yml)

### Features
+ Settings page to configure your OAuth credentials easily
+ Google Drive target folder based on variables
+ Passing credentials through env variables (TODO)


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

Then go to your admin `panel > setting > Uploads` on Google Drive and follow the steps to populate the fields.

### OAuth credentials from env (Not working for now)
If you want to store your OAuth client id and client secret as env var instead of inside the Strapi's store
you can set your config this way:
```js
module.exports = ({ env }) => {
  return {
    'upload-google-drive': {
      enabled: true,
      // showConfig: true,
    },
    upload: {
      config: {
        provider: 'strapi-provider-upload-google-drive',
        providerOptions: {
          clientId: env('GOOGLE_OAUTH_CLIENT_ID'),
          clientSecret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
          token: env('GOOGLE_OAUTH_CLIENT_TOKEN'),
          driveFolderPattern: env('GOOGLE_OAUTH_CLIENT_TOKEN'),
          disableTokenRefresh: env('GOOGLE_OAUTH_CLIENT_TOKEN'),
        },
      },
    },
  }
}
```

### This plugin saved you some time and money?
[Buy me a coffee ;) ](https://www.buymeacoffee.com/jeanclaveau)