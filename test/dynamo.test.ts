import {
  deleteOwnedTenant, isTenantNameAvailable, promiseToCreateTenant, queryTenantInfo,
} from '@/db/dynamoAdminOperations'
import * as chai from 'chai'
import {expect} from 'chai'

const chaiAsPromised = require('chai-as-promised')
const lambda_tester = require('lambda-tester') // load environment

chai.use(chaiAsPromised)


describe('dynamoDB', function(){

  it('should be able for tenant name unused', async () => {
    await expect(await isTenantNameAvailable('abc')).to.be.true
  });

  const itemAddedToDynamo = [
    ['test_user', 'alpha'],
    ['test_user', 'beta'],
  ];

  it('should be able to add item',  () => {
    itemAddedToDynamo.forEach(async ( [name, tenant])=>{
      await expect(promiseToCreateTenant(name, tenant)).to.be.fulfilled
    })
  })

  const itemShouldNotAddedToDynamo = [
    'test_user2', 'beta'
  ]
  it('should not be able to add item', async () => {
    await expect(promiseToCreateTenant('test_user2', 'beta')).to.be.rejected
  })

  it('should not use existed tenant name', async () => {
    await expect(await isTenantNameAvailable('alpha')).to.be.false
  })

  it( 'should not be able to delete others tenant', async () => {
    await expect( deleteOwnedTenant('test_user_owns_nothing', 'alpha')).to.be.rejected
  })

  it ('should be able to delete his own tenant', async () => {
    itemAddedToDynamo.forEach(async ([name, tenant])=>{
      await expect( deleteOwnedTenant(name, tenant)).to.be.fulfilled
    })

  })

  it ('test queryTenantInfo', async () => {
    console.group('test queryTenantInfo')
    try {
      console.log(await queryTenantInfo('alpha'))
    } catch (e) {
      console.error(e)
    }
    console.groupEnd()
  })


  // after(function () {
  //   const allPossibleItem = [ ...itemAddedToDynamo, ...itemShouldNotAddedToDynamo]
  //
  //   //clear up table
  // });
})
