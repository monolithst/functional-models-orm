const merge = require('lodash/merge')

const compile = queryData => () => {
  return queryData.reduce(
    (acc, partial) => {
      if (partial.type === 'property') {
        return merge(acc, { properties: { [partial.name]: partial } })
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
        },
      },
    ])
  }

  return {
    compile: compile(queryData),
    property,
  }
}

module.exports = {
  ormQueryBuilder,
}
