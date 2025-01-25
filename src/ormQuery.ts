import merge from 'lodash/merge'
import get from 'lodash/get'
import flow from 'lodash/flow'
import {
  TakeStatement,
  PaginationStatement,
  DatesBeforeStatement,
  DatesAfterStatement,
  SortStatement,
  PropertyStatement,
  PropertyOptions,
  EqualitySymbol,
  ORMType,
  AllowableEqualitySymbols,
  InnerBuilderV2, QueryTokens,
} from './types'
import {
  SearchQuery,
  BuilderV2,

  BuilderV2Link,
  SubBuilderFunction,
} from './types'

const threeitize = <T>(data: T[]): T[][] => {
  if (data.length === 0 || data.length === 1) {
    return []
  }
  if (data.length < 3) {
    throw new Error('Must include at least 3 items')
  }
  const three = data.slice(0, 3)
  const rest = data.slice(2)
  const moreThrees = threeitize(rest)
  return [three, ...moreThrees]
}

const link = (data: SearchQuery): BuilderV2Link => {
  return {
    and: () => {
      return builderV2({ ...data, query: data.query.concat('AND') })
    },
    or: () => {
      return builderV2({ ...data, query: data.query.concat('OR') })
    },
    compile: () => {
      return data
    },
    take: (num: number) => {
      return link({...data, take: take(num)})
    },
    sort: (key: string, isAscending = true) => {
      return link({...data, sort: sort(key, isAscending)})
    },
    pagination: (value: any) => {
      return link({...data, sort: pagination(value)})
    },
  }
}

const property = (
  name: string,
  value: any,
  {
    caseSensitive = false,
    startsWith = false,
    endsWith = false,
    type = ORMType.string,
    equalitySymbol = EqualitySymbol.eq,
  }: PropertyOptions = {}
) : PropertyStatement => {
  if (!AllowableEqualitySymbols.includes(equalitySymbol)) {
    throw new Error(`${equalitySymbol} is not a valid symbol`)
  }
  if (equalitySymbol !== EqualitySymbol.eq && type === ORMType.string) {
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
  return propertyEntry
}

const take = (num: number): TakeStatement => {
  const parsed = parseInt(num as unknown as string, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`${num} must be an integer.`)
  }
  return parsed
}
const sort = (key: string, isAscending = true): SortStatement => {
  if (typeof isAscending !== 'boolean') {
    throw new Error('Must be a boolean type')
  }
  return {
    key,
    order: isAscending,
  }
}

const pagination = (value: any) : PaginationStatement => {
  return value
}

const datesAfter = (
  key: string,
  jsDate: Date | string,
  { valueType = ORMType.string, equalToAndAfter = true }
): DatesAfterStatement => {
  return {
    type: 'datesAfter',
    key,
    date: jsDate,
    valueType,
    options: {
      equalToAndAfter,
    },
  }
}

const datesBefore = (
  key: string,
  jsDate: Date | string,
  { valueType = ORMType.string, equalToAndBefore = true }
): DatesBeforeStatement => {
  return {
    type: 'datesBefore',
    key,
    date: jsDate,
    valueType,
    options: {
      equalToAndBefore,
    },
  }
}

const isBuilderV2Link = (obj: any) : obj is BuilderV2Link => {
  return Boolean(obj.compile)
}

const _builderV2 = (data: SearchQuery) : InnerBuilderV2 => {

  const myProperty = (...args: any[]) => {
    // @ts-ignore
    const p = property(...args)
    return link(merge(data, { query: data.query.concat(p) }))
  }

  const complex = (subBuilderFunc: SubBuilderFunction) => {
    const subBuilder = builderV2()
    const result = subBuilderFunc(subBuilder)
    if (isBuilderV2Link(result)) {
      const queryTokens : [readonly QueryTokens[]] = [result.compile().query]
      return link(merge(data, {
        query: data.query.concat(queryTokens)
      }))
    }
    // @ts-ignore
    return link(merge(data, { query: data.query.concat([result.query]) }))
  }

  const thisDatesBefore = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndBefore = true }
  ) => {
    const p = datesBefore(key, jsDate, { valueType, equalToAndBefore })
    return link(merge(data, { query: data.query.concat(p) }))
  }

  const thisDatesAfter = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndAfter = true }
  ) => {
    const p = datesAfter(key, jsDate, { valueType, equalToAndAfter })
    return link(merge(data, { query: data.query.concat(p) }))
  }

  return {
    datesBefore: thisDatesBefore,
    datesAfter: thisDatesAfter,
    complex,
    property: myProperty,
  }
}

const builderV2 = (data: SearchQuery | undefined = undefined): BuilderV2 => {
  const theData = data || { take: undefined, sort: undefined, page: undefined, query: [] } as SearchQuery
  const builder = _builderV2(theData)
  const linkData = link(theData)
  return {
    ...builder,
    sort: linkData.sort,
    take: linkData.take,
    pagination: linkData.pagination,
    compile: () => {
      return {
        take: theData.take,
        sort: theData.sort,
        query: [],
        page: theData.page,
      }
    }
  }
}


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


export {
  builderV2,
  take,
  pagination,
  sort,
  property,
  threeitize,
}
