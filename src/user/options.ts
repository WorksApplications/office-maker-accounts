export async function handler(event: any) {
  const origin = event['headers']['origin']
  const ALLOWED_ORIGINS = (process.env.WWW_BASE_URL as string).split(',')
  let return_origin = '*'
  if(origin && ALLOWED_ORIGINS.includes(origin)){
    return_origin = origin
  }
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': return_origin,
      'Access-Control-Allow-Credentials': true,
    }
  }
}
