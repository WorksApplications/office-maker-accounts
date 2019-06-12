'use strict';

let expect = require('chai').expect;

let LambdaTester = require('lambda-tester');
let lambda = require('../functions/authorizer/index')

describe('lamabda', function () {
  before(function () {
    process.env.sourceIp = '1.2.3.4,192.168.1.2,192.168.2.13';
  });
  [
    '1.2.3.4',
    '192.168.1.2',
  ].forEach(function (ip) {
    it('success match ip: ${ip}', () => {

      return LambdaTester(lambda.handler)
        .event(
          {
            requestContext: {
              identity: {
                sourceIp: ip,
              },
            },
          })
        .expectResult((result) => {
          expect(result.policyDocument.Statement[0].Effect).to.be.equal('Allow');
        })
    })
  });
  [
    '192.168.1.1',
    '92.168.1.2',
  ].forEach(function (ip) {
    it('fail to match ip: ${ip}', () => {
      return LambdaTester(lambda.handler)
        .event(
          {
            requestContext: {
              identity: {
                sourceIp: ip,
              },
            },
          })
        .expectResult((result) => {
          expect(result.policyDocument.Statement[0].Effect).to.be.equal('Deny');
        })
    })
  })
})
