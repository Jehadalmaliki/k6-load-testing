#!/bin/bash

echo "🔐 Fetching Auth Token..."
AUTH_TOKEN=$(curl -s -X POST 'https://qa.fastn.ai/auth/realms/fastn/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'realm: fastn' \
  -H 'accept: */*' \
  -d 'grant_type=password&username=automation@fastn.ai&password=automation@fastn.ai&client_id=fastn-app&redirect_uri=https://google.com&scope=openid' \
  | jq -r '.access_token')

if [ -z "$AUTH_TOKEN" ] || [ "$AUTH_TOKEN" == "null" ]; then
  echo "❌ Failed to fetch auth token. Exiting."
  exit 1
fi

echo "✅ Auth token fetched."

# 🔍 Check for --cloud flag
USE_CLOUD=false
for arg in "$@"
do
  if [ "$arg" == "--cloud" ]; then
    USE_CLOUD=true
    break
  fi
done

echo "🚀 Running k6 test..."

if [ "$USE_CLOUD" = true ]; then
  echo "☁️ Using K6 Cloud output..."
  k6 cloud \
    --env K6_AUTH_TOKEN="$AUTH_TOKEN" \
    main.js
else
  echo "💾 Using local InfluxDB output..."
  k6 run \
    --env K6_AUTH_TOKEN="$AUTH_TOKEN" \
    --out influxdb=http://localhost:8087/k6 \
    main.js
fi
