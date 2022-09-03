#!/bin/bash

# rm -rf strapi-test-project/
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

./import_sqlite_fixtures.sh

TEST_PROJECT_FOLDER="strapi-test-project"
cd $TEST_PROJECT_FOLDER


# TODO build if option is set
# TODO watch on test files
# TODO watch on server files
# TODO watch on admin files with rebuild

yarn build

yarn pm2 start "PORT=13377 yarn develop"
$SCRIPT_DIR/../node_modules/.bin/wait-port 13377

