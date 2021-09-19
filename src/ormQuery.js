const merge = require('lodash/merge')

const compile = (queryData) => () => {
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


const ormQueryBuilderAndOr = (queryData) => {
  const and = () => {
    return ormQueryBuilder([...queryData, { type: 'and' }] )
  }
  const or = () => {
    return ormQueryBuilder([...queryData, { type: 'or' }] )
  }
  return {
    compile: compile(queryData),
    and,
    or,
  }
}

const ormQueryBuilder = (queryData=[]) => {
  const field = (name, value, {caseSensitive=false}={}) => {
    return ormQueryBuilderAndOr([...queryData, {
      type: 'field',
      name,
      value,
      options: {
        caseSensitive
      }}])
  }

  return {
    compile: compile(queryData),
    field,
  }
}

module.exports = {
  ormQueryBuilder
}
