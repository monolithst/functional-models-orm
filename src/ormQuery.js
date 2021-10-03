const merge = require('lodash/merge')

const compile = queryData => () => {
  // TODO: This does not handle AND/OR at all.
  return queryData.reduce(
    (acc, partial) => {
      if (partial.type === 'property') {
        return merge(acc, { properties: { [partial.name]: partial } })
      }
      if (partial.type === 'page') {
        return merge(acc, { page: partial.value })
      }
      return acc
    },
    { properties: {} }
  )
}

const ormQueryBuilderAndOr = queryData => {
  const and = () => {
    return ormQueryBuilder([...queryData, { type: 'and' }])
  }
  const or = () => {
    return ormQueryBuilder([...queryData, { type: 'or' }])
  }
  return {
    compile: compile(queryData),
    and,
    or,
  }
}

const ormQueryBuilder = (queryData = []) => {
  const property = (name, value, { caseSensitive = false } = {}) => {
    return ormQueryBuilderAndOr([
      ...queryData,
      {
        type: 'property',
        name,
        value,
        options: {
          caseSensitive,
          startsWith: false,
          endsWith: false,
        },
      },
    ])
  }

  const pagination = value => {
    return ormQueryBuilderAndOr([
      ...queryData,
      {
        type: 'page',
        value,
      },
    ])
  }

  return {
    compile: compile(queryData),
    property,
    pagination,
  }
}

module.exports = {
  ormQueryBuilder,
}
