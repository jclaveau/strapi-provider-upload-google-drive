#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

TEST_PROJECT_FOLDER="strapi-test-project"

sqlite3 "$SCRIPT_DIR/$TEST_PROJECT_FOLDER/.tmp/data.db" ".output $SCRIPT_DIR/fixtures.sql.dump" ".dump"
