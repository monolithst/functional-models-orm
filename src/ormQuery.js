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
      }
      return merge(acc, { [partial.type]: partial.value })
    },
    { properties: {}, chain: queryData }
  )
}

const ormQueryBuilder = (queryData = []) => {
  const property = (
    name,
    value,
    { caseSensitive = false, startsWith = false, endsWith = false } = {}
  ) => {
    return ormQueryBuilder([
      ...queryData,
      {
        type: 'property',
        name,
        value,
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
