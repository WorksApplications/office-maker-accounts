#!/bin/bash
FILE_DIR=`dirname $0`
cd ${FILE_DIR}

if [[ $(jq > /dev/null 2>&1) -ne 0 ]];then
	echo "This script need jq to run"
fi

if [[ $(yq > /dev/null 2>&1) -ne 0 ]];then
	echo "This script need yq to run"
fi

SLS_FILE="../.serverless/serverless-state.json"
STAGE="$(cat ${SLS_FILE} | jq .service.provider.stage -r)"
SERVICE="$(cat ${SLS_FILE} | jq .service.service -r)"
STACK_NAME="$SERVICE-$STAGE"

stack_output="$(aws cloudformation describe-stacks --stack-name ${STACK_NAME} --output json)"

COGNITO_POOL_ADMIN="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapAdminUserPool").OutputValue' -r)"
COGNITO_CLIENT_ADMIN="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapAdminPoolClient").OutputValue' -r)"
COGNITO_POOL_USER="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapUsersUserPool").OutputValue' -r)"
COGNITO_CLIENT_USER="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapUsersPoolClient").OutputValue' -r)"
ENDPOINT="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "ServiceEndpoint").OutputValue' -r)"
DB_TENANT_NAME="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapTenantDB").OutputValue' -r)"
DB_USER_PRI_NAME="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapUserPriDB").OutputValue' -r)"

TEST_USERNAME="test_admin@example.com"
TEMPORARY_PASSWORD="Test123-Test"
# Test
### username test_admin@example.com, temp password: Test123-Test
if ! [[ ${STAGE} =~ prod|production ]]; then
	aws cognito-idp admin-create-user --user-pool-id "$COGNITO_POOL_ADMIN" --username test_admin@example.com \
		--temporary-password=Test123-Test
fi

echo "{
  \"TEST_USERNAME\": \"${TEST_USERNAME}\",
  \"TEMPORARY_PASSWORD\": \"${TEMPORARY_PASSWORD}\",
  \"COGNITO_POOL_ADMIN\": \"${COGNITO_POOL_ADMIN}\",
  \"COGNITO_CLIENT_ADMIN\": \"${COGNITO_CLIENT_ADMIN}\",
  \"ENDPOINT\": \"${ENDPOINT}\",
  \"DB_TENANT_NAME\": \"${DB_TENANT_NAME}\",
  \"DB_USER_PRI_NAME\": \"${DB_USER_PRI_NAME}\"
}" > ../test-flow/env.json

if ! [[ ${STAGE} =~ prod|production ]]; then
	../node_modules/.bin/mocha -r ts-node/register -r tsconfig-paths/register "../test-flow/*.ts"
fi
