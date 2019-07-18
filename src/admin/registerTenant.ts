import {
  adminPoolAddTenantInfo as cognitoAddTenantRecord, userAbleToCreateTenant, // cognito adminGetUser //congito adminUpdateUserAttributes
} from '@/cognito/cognitoAdminOperations'
import {promiseToCreateTenant as dbAddRecordIfAble} from '@/db/dynamoAdminOperations' //dynamodb putItem
import response from '@/lambdaResponse'
import {validateTenant} from '@/tenantNameRegex'

/**
 * @param event
 * @return {{headers: *, body: *, statusCode: *}|{body: *, statusCode: *}}
 */
export async function handler( event: any){
  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenantName = event['queryStringParameters']['tenant']

  try{
    await validateTenant(tenantName)
  } catch (e) {
    return response(400, e.message)
  }

  try {
    await userAbleToCreateTenant(userName)
  } catch (e) {
    return response(403, 'user cannot create tenant')
  }

  try{
    await dbAddRecordIfAble(userName,tenantName)
  } catch (e) {
    return response(409, 'tenant name already exists')
  }

  try{
    await cognitoAddTenantRecord(userName, tenantName)
    return response(200)
  } catch (e) {
    console.log(e)
    return response(400, 'unexpected error when saving tenant info into cognito')
  }
}

