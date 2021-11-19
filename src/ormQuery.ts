const merge = require('lodash/merge')

enum EQUALITY_SYMBOLS {
  EQUALS='=',
  LT='<',
  LTE='<=',
  GT='>',
  GTE='>=',
}

const ALLOWABLE_EQUALITY_SYMBOLS = Object.values(EQUALITY_SYMBOLS)

type PropertyStatement = {
  type: 'property',
  name: string,
  value: any,
  valueType: ORMType,
  options: {
    caseSensitive: boolean,
    startsWith: boolean,
    endsWith: boolean,
    equalitySymbol: EQUALITY_SYMBOLS,
  }
}

type PageValue = any
type TakeValue = number


type PaginationStatement = {
  type: 'page',
  value: PageValue,
}

type TakeStatement = {
  type: 'take',
  value: TakeValue,
}

type SortStatement = {
  type: 'sort',
  key: string,
  order: boolean,
}

type DatesAfterStatement = {
  type: 'datesAfter',
  key: string,
  date: Date|string,
  valueType: ORMType,
  options: {
    equalToAndAfter: boolean,
  }
}

type DatesBeforeStatement = {
  type: 'datesBefore',
  key: string,
  date: Date|string,
  valueType: ORMType,
  options: {
    equalToAndBefore: boolean,
  }
}

type AndStatement = {
  type: 'and',
}

type OrStatement = {
  type: 'or',
}

type OrmQuery = {
  properties: {
    [s: string]: PropertyStatement
  },
  datesAfter?: {
    [s: string]: DatesAfterStatement,
  },
  datesBefore?: {
    [s: string]: DatesBeforeStatement,
  },
  sort?: SortStatement,
  take?: TakeValue,
  page?: PageValue,
  chain: OrmQueryStatement[],
}

enum ORMType {
  string='string',
  number='number',
  date='date',
  object='object',
  boolean='boolean',
}

const compile = (queryData: OrmQueryStatement[]) => () : OrmQuery => {
  // TODO: This does not handle AND/OR at all.
  const startingQuery : OrmQuery = { properties: {}, chain: queryData }
  return queryData.reduce(
    (acc, partial) => {
      if (partial.type === 'property') {
        return merge(acc, { properties: { [partial.name]: partial } })
      } else if (partial.type === 'and') {
        return acc
      } else if (partial.type === 'or') {
        return acc
      } else if (partial.type === 'datesAfter') {
        return acc.datesAfter
          ? merge(acc, { datesAfter: {...acc.datesAfter, [partial.key]: partial } })
          : merge(acc, { datesAfter: {[partial.key]: partial} })
      } else if (partial.type === 'datesBefore') {
        return acc.datesBefore
          ? merge(acc, { datesBefore: {...acc.datesBefore, [partial.key]: partial } })
          : merge(acc, { datesBefore: {[partial.key]: partial} })
      } else if (partial.type === 'sort') {
        return merge(acc, { [partial.type]: partial })
      }
      return merge(acc, { [partial.type]: partial.value })
    },
    startingQuery
  )
}

type OrmQueryStatement = DatesAfterStatement |
  DatesBeforeStatement |
  SortStatement |
  TakeStatement |
  PaginationStatement |
  PropertyStatement |
  AndStatement |
  OrStatement

const ormQueryBuilder = (queryData : OrmQueryStatement[] = []) => {
  const datesAfter = (key: string, jsDate: Date|string, { valueType=ORMType.string, equalToAndAfter=true}) => {
    const datesAfter : DatesAfterStatement = {
      type: 'datesAfter',
      key,
      date: jsDate,
      valueType,
      options: {
        equalToAndAfter
      }
    }
    return ormQueryBuilder([
      ...queryData,
      datesAfter,
    ])
  }

  const datesBefore = (key: string, jsDate:Date|string, { valueType=ORMType.string, equalToAndBefore=true}) => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'datesBefore',
        key,
        date: jsDate,
        valueType,
        options: {
          equalToAndBefore,
        },
      },
    ])
  }

  const property = (
    name: string,
    value: any,
    {
      caseSensitive = false,
      startsWith = false,
      endsWith = false,
      type=ORMType.string,
      equalitySymbol=EQUALITY_SYMBOLS.EQUALS
    } = {}
  ) => {
    if (!ALLOWABLE_EQUALITY_SYMBOLS.includes(equalitySymbol)) {
      throw new Error(`${equalitySymbol} is not a valid symbol`)
    }
    if (equalitySymbol !== EQUALITY_SYMBOLS.EQUALS && type !== ORMType.string) {
      throw new Error(`Cannot use a non = symbol for a non string type of ${type}`)
    }
    if (!type) {
      type = ORMType.string
    }

    const propertyEntry : PropertyStatement =  {
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
    return ormQueryBuilder([
      ...queryData,
      propertyEntry,
    ])
  }

  const pagination = (value: any) => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'page',
        value,
      },
    ])
  }

  const take = (count: number) => {
    const parsed = parseInt(count as unknown as string, 10)
    if (Number.isNaN(parsed)) {
      throw new Error(`${count} must be an integer.`)
    }
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'take',
        value: parsed,
      },
    ])
  }

  const sort = (key: string, isAscending=true) => {
    if (typeof isAscending !== 'boolean') {
      throw new Error('Must be a boolean type')
    }
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'sort',
        key,
        order: isAscending,
      },
    ])
  }

  const and = () => {
    return ormQueryBuilder([...queryData, { type: 'and' }])
  }
  const or = () => {
    return ormQueryBuilder([...queryData, { type: 'or' }])
  }

  return {
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
}

module.exports = {
  ormQueryBuilder,
  EQUALITY_SYMBOLS,
}
