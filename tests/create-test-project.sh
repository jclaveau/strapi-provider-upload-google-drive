#!/bin/bash

# rm -rf strapi-test-project/
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

TEST_PROJECT_FOLDER="strapi-test-project"
if [ ! -d "$TEST_PROJECT_FOLDER" ]; then
  # npx -y create-strapi-app@latest $TEST_PROJECT_FOLDER --quickstart --no-run
  # https://github.com/strapi/strapi/blob/main/packages/cli/create-strapi-app/create-strapi-app.js#L23
  yarn create strapi-app $TEST_PROJECT_FOLDER --quickstart --no-run
fi

# ln -s "$SCRIPT_DIR/test-server.js" "$TEST_PROJECT_FOLDER/test-server.js"

cp ./config/* $TEST_PROJECT_FOLDER/config/
cd $TEST_PROJECT_FOLDER
yarn add link:../../
cd ..

cd $TEST_PROJECT_FOLDER
# TODO move it to the plugin package
yarn add --dev pm2
yarn build --no-optimization
# yarn develop
# https://github.com/strapi/strapi/blob/main/packages/core/strapi/bin/strapi.js#L86
# yarn start

