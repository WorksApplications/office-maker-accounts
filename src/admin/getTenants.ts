import {getTenantList} from '@/cognito/cognitoAdminOperations'
import response from '@/lambdaResponse'

// cognito adminGetUser
export const handler = async ( event: any ) => {
  console.log(event)

  const userName = event['requestContext']['authorizer']['claims']['cognito:username']
  const list = await getTenantList(userName)
  return response(200, JSON.stringify(list))

}
