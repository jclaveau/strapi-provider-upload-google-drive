module.exports = ({ env }) => {
  return {
    'upload-google-drive': {
      enabled: true,
      showConfig: true,
    },
    upload: {
      config: {
        provider: 'strapi-provider-upload-google-drive', // For community providers pass the full package name (e.g. provider: 'strapi-provider-upload-google-cloud-storage')
        providerOptions: {
          clientId: env('GOOGLE_OAUTH_CLIENT_ID'),
          clientSecret: env('GOOGLE_OAUTH_CLIENT_SECRET'),
          token: env('GOOGLE_OAUTH_CLIENT_TOKEN'),
        },
      },
    },
  }
}
