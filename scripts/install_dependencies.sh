#!/bin/bash

set -o pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
REPOSITORY_ROOT="$(dirname "$SCRIPT_DIR")"
ACTIONS_ROOT="$REPOSITORY_ROOT/actions"
CONFIG_FOR_ACTIONS="$ACTIONS_ROOT/config-for-actions"
FILE_DUP_ACTION="$ACTIONS_ROOT/file-dup-action"

cd "$CONFIG_FOR_ACTIONS"
npm install
cd "$REPOSITORY_ROOT"

cd "$FILE_DUP_ACTION"
npm install
cd "$REPOSITORY_ROOT"
