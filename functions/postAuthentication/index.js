'use strict';

const jwt = require('jsonwebtoken');
const fs = require('fs');
const ldap = require('ldapauth-fork');
const dns = require('dns');
const bunyan = require('bunyan');

dns.setServers([process.env.dnsServer]);

function getLdapServer(hostname) {
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, address) => {
        if (err) {
            console.log("hostname wasn't resolved");
            reject(err);
        }
        resolve(address);
    });
  });
};

function login (userId, password) {
  return new Promise((resolve, reject) => {
    getLdapServer(process.env.ldapServer).then((address) => {
      let logger = bunyan.createLogger({
        name: 'ldap',
        stream: process.stdout,
        level: process.env.logLevel,
      });
      let auth = new ldap({
        url: 'ldap://' + address + ':' + process.env.ldapPort,
        searchBase: process.env.searchBase,
        searchFilter: process.env.searchFilter,
        groupSearchBase: process.env.groupSearchBase,
        groupSearchFilter: process.env.groupSearchFilter,
        groupSearchScope: 'base',
        groupSearchAttributes: ['dn', 'cn'],
        reconnect: true,
        log: logger
      });

      auth.authenticate(userId, password, (err, user) => {
        auth.close((err) => {
          if (err) {
            console.log("auth close err: " + err);
          };
        });
        if (err) {
          reject(err);
        } else if (user._groups.length === 0) {
          reject("No group user");
        } else {
          resolve(user);
        }
      });
    });
  });
};

function createToken(userId, role, tenantDomain) {
  let expire = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 2);
  let cert = fs.readFileSync(process.env.privatekey);
  return jwt.sign({exp: expire, userId: userId, role: role, tenantDomain: tenantDomain}, cert, { algorithm: 'RS512'})
};

function createResponse(statusCode, token) {
  let body = "";
  if (statusCode === 200) {
    body = { accessToken: token };
  } else if (statusCode === 400) {
    body = { message: "bad request" };
  } else if (statusCode === 401) {
    body = { message: "unauthorized" };
  } else {
    body = { message: "unexpected error" };
  };
  let response = {
    statusCode: statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
  return response;
}

module.exports.handler = (event, context, callback) => {
  //context.callbackWaitsForEmptyEventLoop = false;
  // console.log('Received event:', JSON.stringify(event, null, 2));
  let userInfo;
  try {
    userInfo = JSON.parse(event.body);
  } catch (e) {
    if (e instanceof SyntaxError) {
      callback(null, createResponse(400, null));
      return;
    } else {
      callback(null, createResponse(500, null));
      return;
    }
  }

  login(userInfo.userId, userInfo.password)
    .then((user) => {
      let domain = userInfo.userId.substr(userInfo.userId.indexOf("@") + 1);
      let token = createToken(userInfo.userId, "ADMIN", domain);
      // console.log('token:', token);
      callback(null, createResponse(200, token));
    }, (err) => {
      console.log("auth error: " + err);
      callback(null, createResponse(401, null));
    });
};
