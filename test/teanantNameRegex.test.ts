import {validateTenant} from '@/tenantNameRegex'
import * as chai from 'chai'
import {expect} from 'chai'

const chaiAsPromised = require('chai-as-promised')


chai.use(chaiAsPromised)

describe('tenant Name Regex', function () {
  const validNames = [
    'example',
    'worksmap2',
    'w0r21map',
    'work-map',
    'workmap-',
  ]

  it('check valid tenantNames', async () => {
    await expect(Promise.all(validNames.map(validateTenant))).to.be.fulfilled
  })

  const invalidNames = [
    'worksmap',
    'worksMap',
    '5orksmap',
    'worksmap.com',
    '-worksmap',
    'work_map',
    'worksmap_',
    '_worksmap',
    'w',
    'wor',
  ]

  it('check invalid tenantNames', async () => {
    invalidNames.forEach(async ( item ) => {
      await expect(validateTenant(item)).to.be.rejected
    })
  })
})
