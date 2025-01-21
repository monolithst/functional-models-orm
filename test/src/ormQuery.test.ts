import sinon from 'sinon'
import { assert } from 'chai'
import get from 'lodash/get'
import pick from 'lodash/pick'
import {
  ormQueryBuilder,
  queryBuilderPropertyFlowFunc,
  ormQueryBuilderFlow,
  createBooleanChains,
} from '../../src/ormQuery'
import {
  OrmQueryStatement,
  PropertyStatement,
  AndStatement,
  OrStatement,
  DatesAfterStatement,
  DatesBeforeStatement,
  OrmQueryBuilder,
  BooleanChains,
  EqualitySymbol,
  ORMType,
} from '../../src/types'

const TEST_OBJS: { [s: string]: PropertyStatement } = {
  'my-name': {
    type: 'property',
    name: 'my-name',
    value: 'my-value',
    valueType: ORMType.string,
    options: {
      caseSensitive: false,
      startsWith: false,
      equalitySymbol: EqualitySymbol.eq,
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
      equalitySymbol: EqualitySymbol.eq,
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
      equalitySymbol: EqualitySymbol.eq,
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
      equalitySymbol: EqualitySymbol.eq,
      endsWith: true,
    },
  },
}
describe('/src/ormQuery.ts', () => {
  describe('#createBooleanChains()', () => {
    it('should find 3 and statements when only properties are used', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .property('b', 2)
        .property('c', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [
          input.properties.a,
          input.properties.b,
          input.properties.c,
        ] as PropertyStatement[],
        orChains: [] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should find 3 and statements when only properties are used separated by ands()', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .and()
        .property('b', 2)
        .and()
        .property('c', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [
          input.properties.a,
          input.properties.b,
          input.properties.c,
        ] as PropertyStatement[],
        orChains: [] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should throw an exception if and() starts the orm query', () => {
      assert.throws(() => {
        const input = ormQueryBuilder()
          .and()
          .property('a', 1)
          .and()
          .property('b', 2)
          .and()
          .property('c', 3)
          .compile()
        return createBooleanChains(input)
      })
    })
    it('should throw an exception if or() starts the orm query', () => {
      assert.throws(() => {
        const input = ormQueryBuilder()
          .or()
          .property('a', 1)
          .and()
          .property('b', 2)
          .and()
          .property('c', 3)
          .compile()
        return createBooleanChains(input)
      })
    })
    it('should throw an exception if two and() are together', () => {
      assert.throws(() => {
        const input = ormQueryBuilder()
          .property('a', 1)
          .and()
          .and()
          .property('b', 2)
          .and()
          .property('c', 3)
          .compile()
        return createBooleanChains(input)
      })
    })
    it('should throw an exception if two or() are together', () => {
      assert.throws(() => {
        const input = ormQueryBuilder()
          .property('a', 1)
          .or()
          .or()
          .property('b', 2)
          .and()
          .property('c', 3)
          .compile()
        return createBooleanChains(input)
      })
    })
    it('should find 1 AND statement and 1 OR statement', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .and()
        .property('b', 2)
        .or()
        .property('c', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [input.properties.a] as PropertyStatement[],
        orChains: [
          [input.properties.b, input.properties.c],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should find 1 AND statement and 1 OR statement, when no AND statements are used', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .property('b', 2)
        .or()
        .property('c', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [input.properties.a] as PropertyStatement[],
        orChains: [
          [input.properties.b, input.properties.c],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should find 3 AND statement and 2 OR statement', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .property('b', 2)
        .or()
        .property('c', 3)
        .property('d', 1)
        .property('e', 2)
        .or()
        .property('f', 3)
        .property('g', 1)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [
          input.properties.a,
          input.properties.d,
          input.properties.g,
        ] as PropertyStatement[],
        orChains: [
          [input.properties.b, input.properties.c],
          [input.properties.e, input.properties.f],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should find 1 AND statement and 1 OR statement containing 4 statements', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .or()
        .property('b', 2)
        .or()
        .property('c', 3)
        .or()
        .property('d', 4)
        .property('e', 5)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [input.properties.e] as PropertyStatement[],
        orChains: [
          [
            input.properties.a,
            input.properties.b,
            input.properties.c,
            input.properties.d,
          ],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should create two OR statements with 2 statements each', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .or()
        .property('b', 2)
        .property('c', 1)
        .or()
        .property('d', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [] as PropertyStatement[],
        orChains: [
          [input.properties.a, input.properties.b],
          [input.properties.c, input.properties.d],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should create two OR statements with 2 statements each, with 1 and statement', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .or()
        .property('b', 2)
        .property('z', 1)
        .property('c', 1)
        .or()
        .property('d', 3)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [input.properties.z] as PropertyStatement[],
        orChains: [
          [input.properties.a, input.properties.b],
          [input.properties.c, input.properties.d],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
    it('should find 4 AND statement and 2 OR statements containing 2 and 3 statements, when full complexity is present', () => {
      const input = ormQueryBuilder()
        .property('a', 1)
        .or()
        .property('b', 2)
        .and()
        .property('c', 1)
        .and()
        .property('d', 1)
        .and()
        .property('e', 1)
        .or()
        .property('f', 3)
        .or()
        .property('g', 4)
        .property('h', 5)
        .property('i', 5)
        .compile()
      const actual = createBooleanChains(input)
      const expected = {
        ands: [
          input.properties.c,
          input.properties.d,
          input.properties.h,
          input.properties.i,
        ] as PropertyStatement[],
        orChains: [
          [input.properties.a, input.properties.b],
          [input.properties.e, input.properties.f, input.properties.g],
        ] as readonly PropertyStatement[][],
      } as BooleanChains
      assert.deepEqual(actual, expected)
    })
  })
  describe('#ormQueryBuilderFlow()', () => {
    it('should return a orm query even when called with an empty array', () => {
      const ormQuery = ormQueryBuilderFlow([])
      assert.isOk(ormQuery.properties)
    })
    it('should call passed in functions', () => {
      const myBuilderFunc = sinon.stub().callsFake(x => x)
      const ormQuery = ormQueryBuilderFlow([myBuilderFunc])
      assert.isTrue(myBuilderFunc.called)
    })
    it('should pass in an ormQueryBuilder object into the functions', () => {
      const myBuilderFunc = sinon.stub().callsFake(x => x)
      const ormQuery = ormQueryBuilderFlow([myBuilderFunc])
      const actual = myBuilderFunc.getCall(0).args[0]
      assert.isOk(actual.compile)
    })
  })
  describe('#queryBuilderPropertyFlowFunc()', () => {
    it('should find the key in the passed in filters, and use it in the builder', () => {
      const mockBuilder = {
        property: sinon.stub(),
      }
      const instance = queryBuilderPropertyFlowFunc({ myKey: 'myValue' })(
        'myKey'
      )(mockBuilder as unknown as OrmQueryBuilder)
      const actual = mockBuilder.property.getCall(0).args
      const expected = ['myKey', 'myValue', undefined]
      assert.deepEqual(actual, expected)
    })
    it('should not find the key in the passed in filters, and never call the builder', () => {
      const mockBuilder = {
        property: sinon.stub(),
      }
      const instance = queryBuilderPropertyFlowFunc({ anotherKey: 'myValue' })(
        'myKey'
      )(mockBuilder as unknown as OrmQueryBuilder)
      assert.isFalse(mockBuilder.property.called)
    })
    it('should find the key in the passed in filters, and pass in the options into the builder', () => {
      const mockBuilder = {
        property: sinon.stub(),
      }
      const instance = queryBuilderPropertyFlowFunc({ myKey: 'myValue' })(
        'myKey',
        { startsWith: true }
      )(mockBuilder as unknown as OrmQueryBuilder)
      const actual = mockBuilder.property.getCall(0).args
      const expected = ['myKey', 'myValue', { startsWith: true }]
      assert.deepEqual(actual, expected)
    })
  })
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
            equalitySymbol: EqualitySymbol.gte,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is GT ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EqualitySymbol.gt,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is LTE ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EqualitySymbol.lte,
          })
        })
      })
      it('should throw an exception if type === string while equalitySymbol is LT ', () => {
        assert.throws(() => {
          ormQueryBuilder().property('name', 'value', {
            type: ORMType.string,
            equalitySymbol: EqualitySymbol.lt,
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
