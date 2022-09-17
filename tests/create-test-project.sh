#!/bin/bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

TEST_PROJECT_FOLDER="strapi-test-project"
TEST_PATCH_FOLDER="strapi-test-patch"
if [ ! -d "$TEST_PROJECT_FOLDER" ]; then
  # https://github.com/strapi/strapi/blob/main/packages/cli/create-strapi-app/create-strapi-app.js#L23
  yarn create strapi-app $TEST_PROJECT_FOLDER --quickstart --no-run
fi

cp -r $TEST_PATCH_FOLDER/* $TEST_PROJECT_FOLDER/
cd $TEST_PROJECT_FOLDER

yarn add link:../../ # required for the provider

cd ..

cd $TEST_PROJECT_FOLDER
# required for the watch of the plugin in develop mode
mkdir src/plugins
ln -s ../../../.. src/plugins/strapi-provider-upload-google-drive

# required?
# yarn build --no-optimization

