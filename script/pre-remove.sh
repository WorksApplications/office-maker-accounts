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


cognito_admin_domain="$(yq r ../config.yaml COGNITO.ADMIN_USER_POOL_COGNITO_DOMAIN)"

if [[ "$cognito_admin_domain" == null ]] || [[ "$cognito_admin_domain" == "" ]];then
	# todo: create custom domain with credential
	echo "custom domain add unimplemented"
else
	# add domain for client
	aws cognito-idp delete-user-pool-domain --user-pool-id "$COGNITO_POOL_ADMIN" --domain \
		"$cognito_admin_domain"
fi


cognito_users_domain="$(yq r ../config.yaml COGNITO.USERS_USER_POOL_COGNITO_DOMAIN)"
if [[ "$cognito_users_domain" == null ]] || [[ "$cognito_users_domain" == "" ]];then
	# todo: create custom domain with credential
	echo "custom domain add unimplemented"
else
	# add domain for client
	aws cognito-idp delete-user-pool-domain --user-pool-id "$COGNITO_POOL_USER" --domain \
		"$cognito_users_domain"
fi
