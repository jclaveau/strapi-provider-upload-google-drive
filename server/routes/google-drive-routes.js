module.exports = [
  {
    "method": "GET",
    "path": "/",
    "handler": "googleDrive.index",
    "config": {
      policies: [
        'admin::isAuthenticatedAdmin',
      ],
    }
  },
  {
    "method": "GET",
    "path": "/authUrl",
    "handler": "googleDrive.getAuthUrl",
    "config": {
      policies: [
        'admin::isAuthenticatedAdmin',
      ],
    }
  },
  {
    "method": "GET",
    "path": "/google-auth-redirect-uri",
    "handler": "googleDrive.redeem",
    "config": {
      auth: false,
      "policies": []
    }
  },
  {
    "method": "POST",
    "path": "/redeem",
    "handler": "googleDrive.redeem",
    "config": {
      auth: false,
      "policies": []
    }
  },
  {
    "method": "GET",
    "path": "/file/:filename",
    "handler": "googleDrive.file",
    "config": {
      policies: [
        'admin::isAuthenticatedAdmin',
      ],
    }
  },
  {
    "method": "GET",
    "path": "/google-drive-resulting-folder",
    "handler": "googleDrive.parseFolderPath",
    "config": {
      policies: [
        'admin::isAuthenticatedAdmin',
      ],
    }
  },
];