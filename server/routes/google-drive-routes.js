module.exports = [
  {
    "method": "GET",
    "path": "/",
    "handler": "googleDrive.index",
    "config": {
      auth: false,
    }
  },
  {
    "method": "GET",
    "path": "/authUrl",
    "handler": "googleDrive.getAuthUrl",
    "config": {
      auth: false,
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
      auth: false,
      "policies": []
    }
  },
  {
    "method": "GET",
    "path": "/google-drive-resulting-folder",
    "handler": "googleDrive.parseFolderPath",
    "config": {
      auth: false,
      "policies": []
    }
  },
  {
    "method": "GET",
    "path": "/folder-id",
    "handler": "googleDrive.getFolderId",
    "config": {
      auth: false,
      "policies": []
    }
  },
];