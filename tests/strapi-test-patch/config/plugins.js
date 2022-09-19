module.exports = ({ env }) => {
  return {
    'upload-google-drive': {
      enabled: true,
    },
    upload: {
      config: {
        provider: 'strapi-provider-upload-google-drive', // For community providers pass the full package name (e.g. provider: 'strapi-provider-upload-google-cloud-storage')
        providerOptions: {
          dumpSettings: true,
          displayConfigInSettings: true,
          // clientId: env('GOOGLE_OAUTH_CLIENT_ID'),
          // clientSecret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
          // tokens: env('GOOGLE_OAUTH_CLIENT_TOKENS'),
          // driveFolderPattern: '/test',
        },
      },
    },
  }
}
