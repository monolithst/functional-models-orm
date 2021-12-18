import get from 'lodash/get'
import pick from 'lodash/pick'
import { assert } from 'chai'
import { ormQueryBuilder } from '../../src/ormQuery'
import {
  OrmQueryStatement,
  PropertyStatement,
  AndStatement,
  OrStatement,
  DatesAfterStatement,
  DatesBeforeStatement,
} from '../../src/interfaces'
import { EQUALITY_SYMBOLS, ORMType } from '../../src/constants'

const TEST_OBJS: { [s: string]: PropertyStatement } = {
  'my-name': {
    type: 'property',
    name: 'my-name',
    value: 'my-value',
    valueType: ORMType.string,
    options: {
      caseSensitive: false,
      startsWith: false,
      equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
      endsWith: false,
    },
  },
  'my-name2': {
    type: 'property',
    name: 'my-name2',
    value: 'my-value2',
    valueType: ORMType.string,
    options: {
      caseSensitive: false,
      startsWith: true,
      equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
      endsWith: false,
    },
  },
  'my-name3': {
    type: 'property',
    name: 'my-name3',
    value: 'my-value3',
    valueType: ORMType.string,
    options: {
      caseSensitive: true,
      startsWith: false,
      equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
      endsWith: false,
    },
  },
  'my-name4': {
    type: 'property',
    name: 'my-name4',
    value: 'my-value4',
    valueType: ORMType.string,
    options: {
      caseSensitive: false,
      startsWith: false,
      equalitySymbol: EQUALITY_SYMBOLS.EQUALS,
      endsWith: true,
    },
  },
}
describe('/src/ormQuery.ts', () => {
  describe('#ormQueryBuilder()', () => {
    describe('#property()', () => {
      it('should throw an exception if an unknown equality symbol is passed in', () => {
        assert.throws(() => {
          const query = ormQueryBuilder()
            // @ts-ignore
            .property('name', 'value', { equalitySymbol: 'blah-blah' })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is GTE ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EQUALITY_SYMBOLS.GTE,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is GT ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EQUALITY_SYMBOLS.GT,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is LTE ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EQUALITY_SYMBOLS.LTE,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is LT ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EQUALITY_SYMBOLS.LT,
          })
        })
      })
      it('should set type to string if no type is provided', () => {
        const query = ormQueryBuilder()
          // @ts-ignore
          .property('name', 'value', { type: null })
          .compile()
        const actual = query.properties['name'].valueType
        const expected = ORMType.string
        assert.equal(actual, expected)
      })
    })
    describe('#sort()', () => {
      it('should create a sort property on compile()', () => {
        const query = ormQueryBuilder().sort('key').compile()
        const actual = query.sort
        assert.isOk(actual)
      })
      it('should throw an exception if isAscending is not a boolean', () => {
        assert.throws(() => {
          ormQueryBuilder()
            // @ts-ignore
            .sort('blah', 'not-valid')
        })
      })
    })
    describe('#datesBefore()', () => {
      it('should return two entries for datesBefore when called twice', () => {
        const date = new Date()
        const query = ormQueryBuilder()
          .datesBefore('date1', date, {})
          .datesBefore('date2', date, {})
          .compile()
        if (!query.datesBefore) {
          throw new Error(`No datesBefore produced.`)
        }
        const actual = Object.values(query.datesBefore).length
        const expected = 2
        assert.equal(actual, expected)
      })
      it('should return an expected DatesBeforeStatement when compiled', () => {
        const date = new Date()
        const query = ormQueryBuilder().datesBefore('date', date, {}).compile()
        if (!query.datesBefore) {
          throw new Error(`No datesBefore produced.`)
        }
        const actual = Object.values(query.datesBefore)[0]
        const expected: DatesBeforeStatement = {
          type: 'datesBefore',
          key: 'date',
          date: date,
          valueType: ORMType.string,
          options: {
            equalToAndBefore: true,
          },
        }
        assert.deepInclude(actual, expected)
      })
    })
    describe('#datesAfter()', () => {
      it('should return two entries for datesAfter when called twice', () => {
        const date = new Date()
        const query = ormQueryBuilder()
          .datesAfter('date1', date, {})
          .datesAfter('date2', date, {})
          .compile()
        if (!query.datesAfter) {
          throw new Error(`No datesAfter produced.`)
        }
        const actual = Object.values(query.datesAfter).length
        const expected = 2
        assert.equal(actual, expected)
      })
      it('should return an expected DatesAfterStatement when compiled', () => {
        const date = new Date()
        const query = ormQueryBuilder().datesAfter('date', date, {}).compile()
        if (!query.datesAfter) {
          throw new Error(`No datesAfter produced.`)
        }
        const actual = Object.values(query.datesAfter)[0]
        const expected: DatesAfterStatement = {
          type: 'datesAfter',
          key: 'date',
          date: date,
          valueType: ORMType.string,
          options: {
            equalToAndAfter: true,
          },
        }
        assert.deepInclude(actual, expected)
      })
    })
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
        // @ts-ignore
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
      const actual: {
        readonly properties: {
          readonly [s: string]: PropertyStatement
        }
        readonly chain: readonly OrmQueryStatement[]
      } = pick(result, ['properties', 'chain'])
      const expectedChain: readonly OrmQueryStatement[] = [
        TEST_OBJS['my-name'],
        { type: 'and' } as AndStatement,
        TEST_OBJS['my-name2'],
        { type: 'or' } as OrStatement,
        TEST_OBJS['my-name3'],
        { type: 'or' },
        TEST_OBJS['my-name4'],
        { type: 'page', value: 2 },
        { type: 'take', value: 5 },
      ]
      const expected = {
        properties: TEST_OBJS,
        chain: expectedChain,
      }
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if take("not-a-number") is called', () => {
      const builder = ormQueryBuilder()
      assert.throws(() => {
        // @ts-ignore
        builder.take('not-a-number')
      })
    })
  })
})
