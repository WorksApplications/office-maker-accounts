import response from '@/lambdaResponse'

export async function handler( event: any ) {
  const creator = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenant = event['requestContext']['authorizer']['claims']['custom:tenant']
  const body = JSON.parse(event['body'])
  const targetUser = body['targetUser']
  if ( typeof tenant === 'undefined' ) {
    return response(event['headers']['origin'], 400, 'cannot add user when not own tenant')
  }
}
