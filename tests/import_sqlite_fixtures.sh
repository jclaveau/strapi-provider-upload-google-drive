#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

TEST_PROJECT_FOLDER="strapi-test-project"

mkdir -p "$SCRIPT_DIR/$TEST_PROJECT_FOLDER/.tmp/"
rm "$SCRIPT_DIR/$TEST_PROJECT_FOLDER/.tmp/data.db"
touch "$SCRIPT_DIR/$TEST_PROJECT_FOLDER/.tmp/data.db"
sqlite3 "$SCRIPT_DIR/$TEST_PROJECT_FOLDER/.tmp/data.db" ".read $SCRIPT_DIR/fixtures.sql.dump"
