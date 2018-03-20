'use strict';

const jwt = require('jsonwebtoken');
const fs = require('fs');
const storageBucketName = process.env.storageBucketName;
const lambdaRole = process.env.lambdaRole;
const arnList = process.env.arnWhichAllowedToAccessS3.split(',');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  apiVersion: '2006-03-01'
});


module.exports.handler = (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  generateBucketPolicy(arnList, lambdaRole).then(() => {
    arnList.forEach((arn) => {
      console.log('arn: ', arn);
      var key = arn.split(':')[5];
      createToken(key, 'ADMIN', '').then((token) => {
        putTokenToS3(key + '/token', JSON.stringify({'accessToken': token}), 'application/json').then(() => {
          callback(null, createResponse(200));
        });
      }).catch((err) => {
        console.log('err: ', err);
        callback(null, createResponse(500));
      });
    });
  });
};

function putTokenToS3(key, body, type){
  return new Promise((resolve, reject) => {
    var params = {
      Body: body,
      ContentType: type,
      Bucket: storageBucketName,
      Key: key
    };
    console.log('params: '+JSON.stringify(params));
    return s3.putObject(params, function(err, data) {
      if (err) {
        console.log('err: '+err);
        return reject(err);
      }
      else {
        console.log('data: '+JSON.stringify(data, null, 2));
        return resolve(data);
      }
    });
  });
}


function createToken(userId, role, tenantDomain) {
  return new Promise((resolve, reject) => {
    var expire = Math.floor(Date.now() / 1000) + (60 * 60);
    var cert = fs.readFileSync(process.env.privatekey);
    resolve(jwt.sign({exp: expire, userId: userId, role: role, tenantDomain: tenantDomain}, cert, { algorithm: 'RS512'}));
  });
}

function createResponse(statusCode) {
  var body = '';
  if (statusCode == 200) {
    body = { message: 'OK' };
  } else if(statusCode == 400) {
    body = { message: 'bad request' };
  } else if(statusCode == 401) {
    body = { message: 'unauthorized' };
  } else {
    body = { message: 'unexpected error' };
  }
  var response = {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
  return response;
}

function generateBucketPolicy(arnList, lambdaRole){
  return new Promise((resolve, reject) => {
    var policy = {
      'Version': '2008-10-17',
      'Statement': [
        {
          'Effect': 'Allow',
          'Principal': {
            'AWS': lambdaRole
          },
          'Action': 's3:*',
          'Resource': 'arn:aws:s3:::' + storageBucketName + '/*',
          'Condition': {
            'Bool': {
              'aws:SecureTransport': 'true'
            }
          }
        }
      ]
    };
    arnList.forEach((arn) => {
      policy.Statement.push(
        {
          'Effect': 'Allow',
          'Principal': {
            'AWS': arn
          },
          'Action': 's3:GetObject',
          'Resource': 'arn:aws:s3:::' + storageBucketName + '/' + arn.split(':')[5] + '/*',
          'Condition': {
            'Bool': {
              'aws:SecureTransport': 'true'
            }
          }
        });
      });
      var params = {
        Bucket: storageBucketName,
        Policy: JSON.stringify(policy)
      };
      console.log('params: '+JSON.stringify(params));
      return s3.putBucketPolicy(params, function(err, data) {
        if (err) {
          console.log('err: '+err);
          return reject(err);
        }
        else {
          console.log('data: '+data);
          return resolve(data);
        }
      });
    });
  }
