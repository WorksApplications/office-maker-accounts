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

stack_output="$(aws cloudformation describe-stacks --stack-name ${STACK_NAME})"

COGNITO_POOL_ADMIN="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapAdminUserPool").OutputValue' -r)"
COGNITO_CLIENT_ADMIN="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapAdminPoolClient").OutputValue' -r)"
COGNITO_POOL_USER="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapUsersUserPool").OutputValue' -r)"
COGNITO_CLIENT_USER="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "WorksmapUsersPoolClient").OutputValue' -r)"
ENDPOINT="$(echo ${stack_output} | jq '.Stacks[0].Outputs[] | select(.OutputKey == "ServiceEndpoint").OutputValue' -r)"

TEST_USERNAME="test_admin@example.com"
TEMPORARY_PASSWORD="Test123-Test"
# Test
### username test_admin@example.com, temp password: Test123-Test
if ! [[ ${STAGE} =~ prod|production ]]; then
	aws cognito-idp admin-create-user --user-pool-id "$COGNITO_POOL_ADMIN" --username test_admin@example.com \
		--temporary-password=Test123-Test
fi

echo "{
  \"TEST_USERNAME\": \"test_admin@example.com\",
  \"TEMPORARY_PASSWORD\": \"Test123-Test\",
  \"COGNITO_POOL_ADMIN\": \"${COGNITO_POOL_ADMIN}\",
  \"COGNITO_CLIENT_ADMIN\": \"${COGNITO_CLIENT_ADMIN}\",
  \"ENDPOINT\": \"https://worksmap.test.app.sixleaveakkm.com/api/\",
  \"DB_TENANT_NAME\": \"office-maker-tenants-dev-table\",
  \"DB_USER_PRI_NAME\": \"office-maker-tenants-dev-userPrivilegeTable\"
}" > ../test-flow/env.json

#if ! [[ ${STAGE} =~ prod|production ]]; then
#	env COGNITO_POOL_ADMIN="$COGNITO_POOL_ADMIN" COGNITO_CLIENT_ADMIN="$COGNITO_CLIENT_ADMIN" COGNITO_POOL_USER="$COGNITO_POOL_USER" \
#	COGNITO_CLIENT_USER="$COGNITO_CLIENT_USER" ENDPOINT="$ENDPOINT" TEST_USERNAME="$TEST_USERNAME" TEMPORARY_PASSWORD="$TEMPORARY_PASSWORD" \
#	../node_modules/.bin/mocha --require ts-node/register --require tsconfig-paths/register "../test-flow/flow.test.js"
#fi


