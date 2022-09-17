
module.exports = {
  apps: [
    {
      name: "test-project",
      script: `yarn`,
      args: 'develop',
      interpreter: '/bin/bash',
      cwd: `${__dirname}/strapi-test-project`, // yarn --cwd option doesn't work in PM2
      env: {
        // NODE_ENV: "development",
        PORT: 13377,
        // STRAPI_WEBSITE_URL: "https://localhost:13378",
        STRAPI_WEBSITE_URL: "http://localhost:13377",
        // STRAPI_URL_PREFIX: "",
      },
      // env_test: {
      //   NODE_ENV: "test",
      // },
      // env_staging: {
      //   NODE_ENV: "staging",
      // },
      // env_production: {
      //   NODE_ENV: "production",
      // }
    },
    {
      name: "https-proxy",
      script: `${__dirname}/https-proxy/proxy-server.js`,
      env: {
        NODE_ENV: "development",
        HTTPS_PORT: 13378,
        TARGET_PORT: 13377,
      },
      // env_test: {
      //   NODE_ENV: "test",
      // },
      // env_staging: {
      //   NODE_ENV: "staging",
      // },
      // env_production: {
      //   NODE_ENV: "production",
      // }
    },
  ]
}

