import merge from 'lodash/merge'
import get from 'lodash/get'
import flow from 'lodash/flow'
import {
  OrmQuery,
  OrmQueryStatement,
  TakeStatement,
  PaginationStatement,
  DatesBeforeStatement,
  DatesAfterStatement,
  SortStatement,
  PropertyStatement,
  AndStatement,
  OrStatement,
  OrmQueryBuilder,
  BuilderFlowFunction,
  PropertyOptions,
  BooleanChains,
  EQUALITY_SYMBOLS,
  ORMType,
  ALLOWABLE_EQUALITY_SYMBOLS,
} from './types'

const compile = (queryData: readonly OrmQueryStatement[]) => (): OrmQuery => {
  // TODO: This does not handle AND/OR at all.
  const startingQuery: OrmQuery = { properties: {}, chain: queryData }
  return queryData.reduce((acc, partial) => {
    if (partial.type === 'property') {
      return merge(acc, { properties: { [partial.name]: partial } })
    } else if (partial.type === 'and') {
      return acc
    } else if (partial.type === 'or') {
      return acc
    } else if (partial.type === 'datesAfter') {
      return acc.datesAfter
        ? merge(acc, {
            datesAfter: { ...acc.datesAfter, [partial.key]: partial },
          })
        : merge(acc, { datesAfter: { [partial.key]: partial } })
    } else if (partial.type === 'datesBefore') {
      return acc.datesBefore
        ? merge(acc, {
            datesBefore: { ...acc.datesBefore, [partial.key]: partial },
          })
        : merge(acc, { datesBefore: { [partial.key]: partial } })
    } else if (partial.type === 'sort') {
      return merge(acc, { [partial.type]: partial })
    }
    return merge(acc, { [partial.type]: partial.value })
  }, startingQuery)
}

const ormQueryBuilder = (queryData: readonly OrmQueryStatement[] = []) => {
  const datesAfter = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndAfter = true }
  ) => {
    const datesAfter: DatesAfterStatement = {
      type: 'datesAfter',
      key,
      date: jsDate,
      valueType,
      options: {
        equalToAndAfter,
      },
    }
    return _addStatementAndReturn(datesAfter)
  }

  const datesBefore = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndBefore = true }
  ) => {
    const datesBeforeStatement: DatesBeforeStatement = {
      type: 'datesBefore',
      key,
      date: jsDate,
      valueType,
      options: {
        equalToAndBefore,
      },
    }
    return _addStatementAndReturn(datesBeforeStatement)
  }

  const property = (
    name: string,
    value: any,
    {
      caseSensitive = false,
      startsWith = false,
      endsWith = false,
      type = ORMType.string,
      equalitySymbol = EQUALITY_SYMBOLS.EQUALS,
    }: PropertyOptions = {}
  ) => {
    if (!ALLOWABLE_EQUALITY_SYMBOLS.includes(equalitySymbol)) {
      throw new Error(`${equalitySymbol} is not a valid symbol`)
    }
    if (equalitySymbol !== EQUALITY_SYMBOLS.EQUALS && type === ORMType.string) {
      throw new Error(`Cannot use a non = symbol for a string type`)
    }
    if (!type) {
      type = ORMType.string
    }

    const propertyEntry: PropertyStatement = {
      type: 'property',
      name,
      value,
      valueType: type,
      options: {
        caseSensitive,
        startsWith,
        endsWith,
        equalitySymbol,
      },
    }
    return _addStatementAndReturn(propertyEntry)
  }

  const pagination = (value: any) => {
    const pageStatement: PaginationStatement = {
      type: 'page',
      value,
    }
    return _addStatementAndReturn(pageStatement)
  }

  const take = (count: number) => {
    const parsed = parseInt(count as unknown as string, 10)
    if (Number.isNaN(parsed)) {
      throw new Error(`${count} must be an integer.`)
    }

    const takeStatement: TakeStatement = {
      type: 'take',
      value: parsed,
    }
    return _addStatementAndReturn(takeStatement)
  }

  const sort = (key: string, isAscending = true) => {
    if (typeof isAscending !== 'boolean') {
      throw new Error('Must be a boolean type')
    }
    const sortStatement: SortStatement = {
      type: 'sort',
      key,
      order: isAscending,
    }
    return _addStatementAndReturn(sortStatement)
  }

  const and = () => {
    const statement: AndStatement = { type: 'and' }
    return _addStatementAndReturn(statement)
  }

  const or = () => {
    const statement: OrStatement = { type: 'or' }
    return _addStatementAndReturn(statement)
  }

  const _addStatementAndReturn = (
    statement: OrmQueryStatement
  ): OrmQueryBuilder => {
    return ormQueryBuilder([...queryData, statement])
  }

  const builder: OrmQueryBuilder = {
    compile: compile(queryData),
    datesAfter,
    datesBefore,
    property,
    pagination,
    sort,
    take,
    and,
    or,
  }
  return builder
}

const queryBuilderPropertyFlowFunc =
  (filters: object) =>
  (key: string, options?: PropertyOptions) =>
  (builder: OrmQueryBuilder): OrmQueryBuilder => {
    if (key in filters) {
      return builder.property(key, get(filters, key), options)
    }
    return builder
  }

const ormQueryBuilderFlow = (
  flowFunctions: BuilderFlowFunction[]
): OrmQuery => {
  return flow(flowFunctions)(ormQueryBuilder()).compile()
}

type _BuildingBooleanChains = Readonly<{
  ands: (PropertyStatement | DatesBeforeStatement | DatesAfterStatement)[]
  orChains: PropertyStatement[][]
  currentOrChain?: PropertyStatement[]
}>

const isPropertyType = (value: string | undefined) => {
  if (!value) {
    return false
  }
  return (
    value === 'property' || value === 'datesBefore' || value === 'datesAfter'
  )
}

const isBooleanType = (value: string) => {
  return value === 'and' || value === 'or'
}

const createBooleanChains = (ormQuery: OrmQuery): BooleanChains => {
  /*
Cases:
PROPERTY NOW
-None Before
-- None After: combine and quit
-- Property After: combine and move on.
-- Boolean After:_
--- AND After: combine and move on.
--- OR After: start an or chain, put it in, move on.

-Property Before
-- None After: combine and quit.
-- Property After: combine and move on.
-- Boolean After:_
--- AND After: combine and move on.
--- OR After: start an or chain, put it in, move on.

-AND Before
-- None After: combine and move on.
-- Property After: combine and move on.
-- Boolean After:_
--- AND After: combine and move on.
--- OR After: Start an or chain, and put it in.

-OR Before
-- Property After: Put into OR chain, move current into OR chain, continue.
-- Boolean After:_
--- AND After: Put into OR chain, END chain, and continue.
--- OR After: Put into OR chain, continue.

BOOLEAN NOW
- None before: Explode
- None after: Explode
- Property Before: Move on, already handled
- Boolean before: Explode
 */
  const statementsThatMatter = ormQuery.chain.filter(statement => {
    const type = statement.type
    return (
      type === 'property' ||
      type === 'datesBefore' ||
      type === 'datesAfter' ||
      type === 'or' ||
      type === 'and'
    )
  })

  const result = statementsThatMatter.reduce(
    (acc, statement, index, array) => {
      const currentType = statement.type
      const previousType = index === 0 ? undefined : array[index - 1].type
      const afterType = array[index + 1] ? array[index + 1].type : undefined

      // This is a boolean statement?
      if (isBooleanType(currentType)) {
        if (previousType === undefined || afterType === undefined) {
          throw new Error('Cannot start or end a query with a boolean')
        }
        if (isBooleanType(afterType)) {
          throw new Error('Cannot have two booleans back to back.')
        }
      }
      // This is a property statement?
      if (isPropertyType(currentType)) {
        // Are we continuing an or chain???
        if (previousType === 'or') {
          /* istanbul ignore next */
          if (!acc.currentOrChain) {
            /* istanbul ignore next */
            throw new Error(
              'Impossible situation where currentOrChain hasnt been set'
            )
          }
          // Are we going to end this chain now?
          if (afterType !== 'or') {
            const newOrChains = [
              ...acc.orChains,
              [...acc.currentOrChain, statement],
            ]
            return {
              ands: acc.ands,
              orChains: newOrChains,
              currentOrChain: undefined,
            } as _BuildingBooleanChains
          }
          return {
            ands: acc.ands,
            orChains: acc.orChains,
            currentOrChain: [...acc.currentOrChain, statement],
          } as _BuildingBooleanChains
        }
        // Are we starting a new OR chain??
        if (afterType === 'or') {
          return {
            ands: acc.ands,
            orChains: acc.orChains, // we are starting, so it doesn't go here.
            currentOrChain: [statement],
          } as _BuildingBooleanChains
        }
        // Normal AND property situations
        // Ignore, because istanbul complains about no ELSE.
        /* istanbul ignore next */
        if (
          isPropertyType(afterType) ||
          afterType === undefined ||
          afterType === 'and'
        ) {
          // Regardless of what happens, we need to end any OR chains.
          /* istanbul ignore next */
          const orChains = acc.currentOrChain
            ? // currentOrChain should never be empty
              /* istanbul ignore next */
              [...acc.orChains, acc.currentOrChain]
            : acc.orChains
          // This is always an AND, then move on.
          return {
            ands: [...acc.ands, statement],
            orChains: orChains,
            currentOrChain: undefined,
          } as _BuildingBooleanChains
        }
      }
      // Standard unknown passthrough case. If its not a property type we should move on...
      // This should never happen.
      /* istanbul ignore next */
      return acc
    },
    {
      ands: [],
      orChains: [],
      currentOrChain: undefined,
    } as _BuildingBooleanChains
  )

  return {
    ands: result.ands,
    orChains: result.orChains,
  } as BooleanChains
}

export {
  ormQueryBuilder,
  queryBuilderPropertyFlowFunc,
  ormQueryBuilderFlow,
  createBooleanChains,
}
