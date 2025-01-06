import { assert } from 'chai'
import chai from 'chai'
import { create } from '../../src/datastore/noop'

import asPromised from 'chai-as-promised'
// @ts-ignore
chai.use(asPromised)

describe('/src/datastore/noop.ts', () => {
  describe('#create()', () => {
    describe('#search()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.search({})
        return assert.isRejected(promise, 'Cannot run search in noop')
      })
    })
    describe('#save()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.save({})
        return assert.isRejected(promise, 'Cannot run save in noop')
      })
    })
    describe('#delete()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.delete({})
        return assert.isRejected(promise, 'Cannot run delete in noop')
      })
    })
    describe('#retrieve()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.retrieve({})
        return assert.isRejected(promise, 'Cannot run retrieve in noop')
      })
    })
    describe('#createAndSave()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.createAndSave({})
        return assert.isRejected(promise, 'Cannot run createAndSave in noop')
      })
    })
    describe('#bulkInsert()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.bulkInsert({})
        return assert.isRejected(promise, 'Cannot run bulkInsert in noop')
      })
    })
    describe('#count()', () => {
      it('should reject the promise with the expected exception', () => {
        const instance = create()
        // @ts-ignore
        const promise = instance.count()
        return assert.isRejected(promise, 'Cannot run count in noop')
      })
    })
  })
})
