#!/bin/bash

options=$@
arguments=($options)
NO_LOG=false

index=0
for argument in $options
  do
    index=`expr $index + 1`
    case $argument in
      --no-log) NO_LOG=true ;;
      # -abc) echo "key $argument value ${arguments[index]}" ;;
    esac
  done

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

./import_sqlite_fixtures.sh

TEST_PROJECT_FOLDER="strapi-test-project"
cd $TEST_PROJECT_FOLDER

yarn --cwd $SCRIPT_DIR/.. pm2 kill
yarn --cwd $SCRIPT_DIR/.. pm2 flush
yarn --cwd $SCRIPT_DIR/.. pm2 ls
yarn --cwd $SCRIPT_DIR/.. pm2 start tests/test-ecosystem.config.js
# yarn --cwd $SCRIPT_DIR/.. pm2 start tests/test-ecosystem.config.js  --time --log $SCRIPT_DIR/logs # https://stackoverflow.com/a/72482794/2714285

$SCRIPT_DIR/../node_modules/.bin/wait-port 13377

if [ ! $NO_LOG ]; then
  yarn --cwd $SCRIPT_DIR/.. pm2 logs --lines 1000 test-project
fi