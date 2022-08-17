const settingsRoutes = require('./settings-routes')
const driveRoutes = require('./google-drive-routes')

module.exports = [
  ...settingsRoutes,
  ...driveRoutes,
];