const pluginId = require('../admin/src/pluginId')
const path = require('path')

module.exports = {
  init(providerOptions) {
    let driveSettings

    const getDriveService = async () => {
      driveSettings = await strapi.plugin(pluginId).service('settings').get();
      return strapi.plugin(pluginId).service('drive').initFromConfig(driveSettings)
    }


    const getDriveFolderId = async (drive, file) => {
      const driveFolderPattern = drive.getFolderPattern()

      const availableVariablesSourceOfValues = {
        file,
        providerConfig: providerOptions.folderPatternVariables
      }

      const driveFolderPath = drive.getFolderPath(driveFolderPattern, availableVariablesSourceOfValues)
      strapi.log.info(`Uploading ${file.name} to ${driveFolderPath}`)

      const driveFolderId = await drive.findPathId(driveFolderPath)
      return driveFolderId
    }


    const generateFileUrl = (file, driveInfo) => {
      const fileName = file.name.replace(/\.\w+$/, '')
      const fileUrl = `/uploads${driveSettings.localUploadFolder}/${fileName}~${driveInfo.id}${file.ext}`;
      return fileUrl
    }

    return {
      async uploadStream(file, customConfig = {}) {

        const drive = await getDriveService()

        const progressPromise = drive.uploadStream(file, [await getDriveFolderId(drive, file)]);
        const { ...driveInfo } = await progressPromise;

        file.url = generateFileUrl(file, driveInfo);
      },
      async upload(file, customConfig = {}) {
        const drive = await getDriveService()

        const progressPromise = drive.uploadBuffer(file, [await getDriveFolderId(drive, file)]);

        progressPromise.onProgress(progress => {
          // console.log(`Uploading... ${(progress * 100).toFixed(2)}%`);
        });
        const { ...driveInfo } = await progressPromise;

        file.url = generateFileUrl(file, driveInfo);
      },
      async delete(file) {
        try {
          const drive = await getDriveService()

          const fileBase = path.parse(file.url).base
          drive.delete(fileBase).catch(err => {
            strapi.log.error(err.message);
          });

          // TODO delete folder on Drive if empty
        } catch (error) {
          strapi.log.error(error.message);
          throw error
        }
      },
    };
  },
};
