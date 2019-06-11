const sourceIp = process.env.sourceIp;

module.exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const sourceIpList = sourceIp.split(',');
  if (sourceIpList.includes(event.requestContext.identity.sourceIp)) {
    callback(null, generate_policy('user', 'Allow', event.methodArn));
  } else {
    callback(null, generate_policy('user', 'Deny', event.methodArn));
  }
};

function generate_policy(principalId, effect, resource) {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: resource
      }]
    }
  };
}
