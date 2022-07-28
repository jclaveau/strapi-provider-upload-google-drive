const configRoutes = require('./config-routes')
const driveRoutes = require('./google-drive-routes')

module.exports = [
  ...configRoutes,
  ...driveRoutes,
];