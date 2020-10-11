#!/bin/bash -l

set -o pipefail

RULE_CONFIG_FILE="$GITHUB_WORKSPACE/$1"

python /action/cli.py --rule_config_file="$RULE_CONFIG_FILE"
