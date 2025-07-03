#!/bin/bash
# run-k6.sh

echo "Fetching Auth Token..."
AUTH_TOKEN=$(curl -s -X POST 'https://qa.fastn.ai/auth/realms/fastn/protocol/openid-connect/token' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'realm: fastn' \
  -H 'accept: */*' \
  -d 'grant_type=password&username=automation@fastn.ai&password=automation@fastn.ai&client_id=fastn-app&redirect_uri=https://google.com&scope=openid' \
  | jq -r '.access_token')

echo "Running k6 test..."
k6 run --env K6_AUTH_TOKEN=$AUTH_TOKEN main.js
