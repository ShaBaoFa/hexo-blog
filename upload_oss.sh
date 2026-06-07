#!/usr/bin/env bash

set -euo pipefail

required_variables=(
  OSS_AK
  OSS_AK_SECRET
  OSS_ENDPOINT
  OSS_TARGET_BUCKET
)

for variable in "${required_variables[@]}"; do
  if [[ -z "${!variable:-}" ]]; then
    echo "Missing required environment variable: ${variable}" >&2
    exit 1
  fi
done

export OSS_ACCESS_KEY_ID="$OSS_AK"
export OSS_ACCESS_KEY_SECRET="$OSS_AK_SECRET"
export OSS_ENDPOINT

OSSUTIL_BIN="${OSSUTIL_BIN:-ossutil}"

npm run clean
npm run build

"$OSSUTIL_BIN" sync public/ "oss://${OSS_TARGET_BUCKET}/" --delete --force

echo "Deployed public/ to oss://${OSS_TARGET_BUCKET}/"
