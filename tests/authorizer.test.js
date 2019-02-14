
process.env.sourceIp = '192.168.11.21, 200.12.42.32, 1.1.1.1'

const path = require('path');
const authorizer = require(path.resolve(__dirname, '../functions/authorizer/index.js'));


describe('Lambda Authorizer', () => {
  describe('handler', () => {
    it('should output Allow Policy', () => {
      const event = {
        requestContext: {
          identity: {
            sourceIp: '192.168.11.21',
          },
        },
        methodArn: '/GET/xxxxx' ,
      };

      authorizer.handler(event, {}, (error, result) => {
        expect(error).toBeNull();
        expect(result).toMatchObject({
          principalId: 'user',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: 'execute-api:Invoke',
              Effect: 'Allow',
              Resource: event.methodArn,
            }],
          },
        });
      });
    })

    it('should output Deny Policy', () => {
      const event = {
        requestContext: {
          identity: {
            sourceIp: '2.2.2.2',
          },
        },
        methodArn: '/POST/xxxxx',
      };

      authorizer.handler(event, {}, (error, result) => {
        expect(error).toBeNull();
        expect(result).toMatchObject({
          principalId: 'user',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn,
            }],
          },
        });
      });


    })

    it('should output Deny Policy', () => {
      const event = {
        requestContext: {
          identity: {
            sourceIp: '92.168.11.2',
          },
        },
        methodArn: '/POST/xxxxx',
      };

      authorizer.handler(event, {}, (error, result) => {
        expect(error).toBeNull();
        expect(result).toMatchObject({
          principalId: 'user',
          policyDocument: {
            Version: '2012-10-17',
            Statement: [{
              Action: 'execute-api:Invoke',
              Effect: 'Deny',
              Resource: event.methodArn,
            }],
          },
        });
      });

    })

  })
})