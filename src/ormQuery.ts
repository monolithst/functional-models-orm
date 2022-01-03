import merge from 'lodash/merge'
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
} from './interfaces'
import {
  EQUALITY_SYMBOLS,
  ORMType,
  ALLOWABLE_EQUALITY_SYMBOLS,
} from './constants'

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
    } = {}
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

  const _addStatementAndReturn = (statement: OrmQueryStatement) : OrmQueryBuilder => {
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

export {
  ormQueryBuilder
}
