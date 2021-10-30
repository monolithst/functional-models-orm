const get = require('lodash/get')
const pick = require('lodash/pick')
const assert = require('chai').assert
const { ormQueryBuilder } = require('../../src/ormQuery')

const TEST_OBJS = {
  'my-name': {
    type: 'property',
    name: 'my-name',
    value: 'my-value',
    valueType: 'string',
    options: {
      caseSensitive: false,
      startsWith: false,
      endsWith: false,
    },
  },
  'my-name2': {
    type: 'property',
    name: 'my-name2',
    value: 'my-value2',
    valueType: 'string',
    options: {
      caseSensitive: false,
      startsWith: true,
      endsWith: false,
    },
  },
  'my-name3': {
    type: 'property',
    name: 'my-name3',
    value: 'my-value3',
    valueType: 'string',
    options: {
      caseSensitive: true,
      startsWith: false,
      endsWith: false,
    },
  },
  'my-name4': {
    type: 'property',
    name: 'my-name4',
    value: 'my-value4',
    valueType: 'string',
    options: {
      caseSensitive: false,
      startsWith: false,
      endsWith: true,
    },
  },
}
describe('/src/ormQuery.js', () => {
  describe('#ormQueryBuilder()', () => {
    it('should have "my-value" for "my-name" property', () => {
      const builder = ormQueryBuilder()
      const result = builder.property('my-name', 'my-value').compile()
      const actual = get(result, 'properties.my-name.value')
      const expected = 'my-value'
      assert.equal(actual, expected)
    })
    it('should have "my-value" for "my-name" property when there are more than one property', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .property('my-name2', 'my-value2')
        .compile()
      const actual = get(result, 'properties.my-name.value')
      const expected = 'my-value'
      assert.equal(actual, expected)
    })
    it('should have take:5 when .take("5") called', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .property('my-name2', 'my-value2')
        .take('5')
        .compile()
      const actual = get(result, 'take')
      const expected = 5
      assert.equal(actual, expected)
    })
    it('should have take:5 when .take(5) called', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .property('my-name2', 'my-value2')
        .take(5)
        .compile()
      const actual = get(result, 'take')
      const expected = 5
      assert.equal(actual, expected)
    })
    it('should have page:3 when .pagination(3) called', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .pagination(3)
        .compile()
      const actual = get(result, 'page')
      const expected = 3
      assert.equal(actual, expected)
    })
    it('should have page:3 when .pagination({"com":"plex"}) called', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .pagination({ com: 'plex' })
        .compile()
      const actual = get(result, 'page')
      const expected = { com: 'plex' }
      assert.deepEqual(actual, expected)
    })
    it('should produce the expected final object when many functions called', () => {
      const builder = ormQueryBuilder()
      const result = builder
        .property('my-name', 'my-value')
        .and()
        .property('my-name2', 'my-value2', TEST_OBJS['my-name2'].options)
        .or()
        .property('my-name3', 'my-value3', TEST_OBJS['my-name3'].options)
        .or()
        .property('my-name4', 'my-value4', TEST_OBJS['my-name4'].options)
        .pagination(2)
        .take(5)
        .compile()
      const actual = pick(result, ['properties', 'chain'])
      const expected = {
        properties: TEST_OBJS,
        chain: [
          TEST_OBJS['my-name'],
          { type: 'and' },
          TEST_OBJS['my-name2'],
          { type: 'or' },
          TEST_OBJS['my-name3'],
          { type: 'or' },
          TEST_OBJS['my-name4'],
          { type: 'page', value: 2 },
          { type: 'take', value: 5 },
        ],
      }
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if take("not-a-number") is called', () => {
      const builder = ormQueryBuilder()
      assert.throws(() => {
        builder.take('not-a-number')
      })
    })
  })
})
