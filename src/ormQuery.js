const merge = require('lodash/merge')

const compile = queryData => () => {
  // TODO: This does not handle AND/OR at all.
  return queryData.reduce(
    (acc, partial) => {
      if (partial.type === 'property') {
        return merge(acc, { properties: { [partial.name]: partial } })
      } else if (partial.type === 'and') {
        return acc
      } else if (partial.type === 'or') {
        return acc
      } else if (partial.type === 'datesAfter') {
        return merge(acc, { datesAfter: partial })
      } else if (partial.type === 'datesBefore') {
        return merge(acc, { datesBefore: partial })
      }
      return merge(acc, { [partial.type]: partial.value })
    },
    { properties: {}, chain: queryData }
  )
}

const ormQueryBuilder = (queryData = []) => {
  const datesAfter = (key, jsDate, { valueType='string', equalToAndAfter=true}) => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'datesAfter',
        key,
        date: jsDate,
        valueType,
        options: {
          equalToAndAfter
        },
      },
    ])
  }

  const datesBefore = (key, jsDate, { valueType='string', equalToAndBefore=true}) => {
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
    name,
    value,
    { caseSensitive = false, startsWith = false, endsWith = false, type='string' } = {}
  ) => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'property',
        name,
        value,
        valueType: type,
        options: {
          caseSensitive,
          startsWith,
          endsWith,
        },
      },
    ])
  }

  const pagination = value => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'page',
        value,
      },
    ])
  }

  const take = count => {
    const parsed = parseInt(count, 10)
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
    take,
    and,
    or,
  }
}

module.exports = {
  ormQueryBuilder,
}
