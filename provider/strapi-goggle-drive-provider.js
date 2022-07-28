// https://www.npmjs.com/package/strapi-provider-upload-google-drive
// https://docs.strapi.io/developer-docs/latest/development/providers.html#installing-providers


const pluginId = require('../admin/src/pluginId')

module.exports = {
  init(providerOptions) {

    const getDriveService = async () => {
      const driveConfig = await strapi.plugin(pluginId).service('config').get();
      // console.log('provider driveConfig', driveConfig)
      return strapi.plugin(pluginId).service('drive').initFromConfig(driveConfig)
    }

    const getDriveFolderId = async (drive, file) => {
      const driveFolderPattern = drive.getFolderPattern()
      // console.log('uploadStream() driveFolderPattern', driveFolderPattern)

      const availableVariablesSourceOfValues = {
        file,
        providerConfig: providerOptions.folderPatternVariables
      }
      const driveFolderPath = drive.getFolderPath(driveFolderPattern, availableVariablesSourceOfValues)
      console.log(`Uploading ${file.name} to ${driveFolderPath}`)
      // console.log('uploadStream() driveFolderPath', driveFolderPath)

      const driveFolderId = await drive.findPathId(driveFolderPath)
      // console.log('uploadStream() driveFolderId', driveFolderId)
      return driveFolderId
    }

    return {
      async uploadStream(file, customConfig = {}) {
        const drive = await getDriveService()
        const progressPromise = drive.uploadStream(file, [await getDriveFolderId(drive, file)]);
        const { ...driveInfo } = await progressPromise;
        file.url = `/${pluginId}/file/${driveInfo.id}${file.ext}`;
        file.provider_metadata = {
          ...driveInfo,
        };
      },
      async upload(file, customConfig = {}) {
        const drive = await getDriveService()

        const progressPromise = drive.uploadBuffer(file, [await getDriveFolderId(drive, file)]);

        progressPromise.onProgress(progress => {
          // console.log(`Uploading... ${(progress * 100).toFixed(2)}%`);
        });
        const { ...driveInfo } = await progressPromise;

        file.provider_metadata = {
          ...driveInfo,
          // size: Buffer.byteLength(file.buffer),
        };

        console.log('provider driveInfo', driveInfo)

        file.url = `/${pluginId}/file/${driveInfo.id}${file.ext}`;
      },
      async delete(file) {
        try {
          const { provider_metadata: { id } } = file;
          const drive = await getDriveService()

          drive.delete(id, file.ext).catch(err => {
            strapi.log.error(err.message);
          });

          // TODO delete empty folders
        } catch (err) {
          strapi.log.error(err.message);
        }
      },
    };
  },
};
