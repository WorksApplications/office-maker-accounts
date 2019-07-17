import response from '@/lambdaResponse'

export async function handler( event: any ) {
  const creator = event['requestContext']['authorizer']['claims']['cognito:username']
  const tenant = event['requestContext']['authorizer']['claims']['custom:tenant']

  const targetUser = event['body']
  if ( typeof tenant === 'undefined' ) {
    return response(400, 'cannot add user when not own tenant')
  }
}
