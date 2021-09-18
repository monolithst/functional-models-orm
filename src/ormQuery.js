const merge = require('lodash/merge')

const ormQueryBuilder = (queryData=[]) => {
  const compile = () => {
    return queryData.reduce((acc, partial) => {
      if (partial.type === 'field') {
        return merge(
          acc,
          { fields: {[partial.name]: partial}}
        )
      }
      return acc
    }, {fields: {}})
  }

  const field = (name, value, {caseSensitive=false}={}) => {
    return ormQueryBuilder([...queryData, {
      type: 'field',
      name,
      value,
      options: {
        caseSensitive
      }}])
  }

  return {
    compile,
    field,
  }
}

module.exports = {
  ormQueryBuilder
}
