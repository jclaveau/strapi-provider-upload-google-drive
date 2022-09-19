module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  admin: {autoOpen: false},
  // Url MUST be absolute to work with a proxy (including port number).
  url: `${env('STRAPI_WEBSITE_URL', '')}${env('STRAPI_URL_PREFIX', '')}`,
  proxy: true,
});
