module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  watchIgnoreFiles: [
    '**/strapi-test-project', // avoids Error: ELOOP: too many symbolic links encountered
    // './logs',
    // '**/logs',
    '**/test-results',
  ],
});
