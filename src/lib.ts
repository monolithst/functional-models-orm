import {
  SearchQuery,
  BuilderV2,
  BuilderV2Link,
  SubBuilderFunction,
  OrmType
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

const builderV2 = (data: SearchQuery | undefined = undefined): BuilderV2 => {
  data = data || { query: [] }

  const myProperty = (...args: any[]) => {
    // @ts-ignore
    const p = property(...args)
    return link({ ...data, query: data.query.concat(p) })
  }

  const complex = (subBuilderFunc: SubBuilderFunction) => {
    const subBuilder = builderV2()
    const result = subBuilderFunc(subBuilder)
    // @ts-ignore
    if (result.compile) {
      // @ts-ignore
      return link({
        ...data,
        query: data.query.concat([result.compile().query]),
      })
    }
    // @ts-ignore
    return link({ ...data, query: data.query.concat([result.query]) })
  }

  const datesBefore = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndBefore = true }
  ) => {
    const p = datesBefore(key, jsDate, { valueType, equalToAndBefore })
    return link({ ...data, query: data.query.concat(p) })
  }

  const datesAfter = (
    key: string,
    jsDate: Date | string,
    { valueType = ORMType.string, equalToAndAfter = true }
  ) => {
    const p = datesAfter(key, jsDate, { valueType, equalToAndAfter })
    return link({ ...data, query: data.query.concat(p) })
  }

  return {
    datesBefore,
    datesAfter,
    complex,
    property: myProperty,
  }
}
