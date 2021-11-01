const assert = require('chai').assert
const sinon = require('sinon')
const { ormPropertyConfig } = require('../../src/properties')

describe('/src/properties.js', () => {
  describe('#ormPropertyConfig()', () => {
    it('should return one validator when unique:key is set', () => {
      const input = { unique: 'key' }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should return one validator when uniqueTogether:["a", "b"] is set', () => {
      const input = { uniqueTogether: ['a', 'b'] }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 1
      assert.equal(actual, expected)
    })
    it('should return two validators when unique:key and uniqueTogether:["a", "b"] are set', () => {
      const input = { uniqueTogether: ['a', 'b'], unique: 'key' }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return two validators when unique:key and another validator is added', () => {
      const input = { unique: 'key', validators: [() => ({})] }
      const actual = ormPropertyConfig(input).validators.length
      const expected = 2
      assert.equal(actual, expected)
    })
    it('should return a property passed in that is unhandled by the function', () => {
      const input = { unique: 'key', somethingNotThere: 'here' }
      const actual = ormPropertyConfig(input).somethingNotThere
      const expected = 'here'
      assert.equal(actual, expected)
    })
    it('should return no validators when an empty obj is passed', () => {
      const input = {}
      const actual = ormPropertyConfig(input).validators.length
      const expected = 0
      assert.equal(actual, expected)
    })
    it('should return no validators when nothing is passed', () => {
      const actual = ormPropertyConfig().validators.length
      const expected = 0
      assert.equal(actual, expected)
    })
  })
})