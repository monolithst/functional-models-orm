import { OrmQueryStatement, PropertyOptions } from './types'

/*
Situations

[a=true]
[a=true and b=true]
[a=true or b=true]
[a=[b=true or c=true] and d=[e=true and f=true]]

And statement always first.

Rules:
Overall object is an array.

Arrays Must:
Be All statements (Ands)
Be Statements separated by and/or
Cannot end with and/or
Cannot have two and/or in a row.

Each spot can be...
An array
A statement
And/OR



[
  [s1 'and' s2], 'and', [[s3 and s4], 'or', [s3 and s5], 'or' [s4 'or' s5]]
]


 */
import {
  AllowableEqualitySymbols,
  EqualitySymbol,
  ORMType,
  PropertyStatement,
} from './types'

type S = OrmQueryStatement
type E = 'AND' | 'OR'
type Tokens = Tokens[] | S | E

type OverallQuery = Tokens[]

const fu = (o: OverallQuery) => {}

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
) => {
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

/*

[
  [s1 'and' s2], 'and', [[s3 and s4], 'or', [s3 and s5], 'or' [s4 'or' s5]]
]

 */
fu([
  [property('s1', 'abc'), 'AND', property('s2', 'cbd')],
  'AND',
  [
    [property('s3', '123'), 'AND', property('s4', 'abc')],
    'OR',
    [property('s3', '123'), 'AND', property('s5', '098')],
    'OR',
    [
      property('s4', 'abc'),
      'AND',
      property('s5', '098'),
      'AND',
      property('s6', '1111'),
    ],
  ],
])

const processMongoArray = (o: Tokens[]): { $and: any } => {
  // If we don't have any AND/OR its all an AND
  if (o.find(x => x === 'AND' || x === 'OR')) {
    // All ANDS
    return {
      $and: o.map(handleMongoQuery),
    }
  }
  const first = o[0]
  if (first === 'AND' || first === 'OR') {
    throw new Error('Cannot have AND or OR at the very start.')
  }
  const last = o[o.length - 1]
  if (last === 'AND' || last === 'OR') {
    throw new Error('Cannot have AND or OR at the very end.')
  }
  const totalLinks = o.filter(x => x === 'AND' || x === 'OR')
  if (totalLinks.length !== o.length - 1) {
    throw new Error('Must separate each statement with an AND or OR')
  }
  const threes = threeitize(o)
  const allAndStatements = threes.map(([a, l, b]) => {
    if (l !== 'AND' && l !== 'OR') {
      throw new Error(`${l} is not a valid symbol`)
    }
    const aQuery = handleMongoQuery(a)
    const bQuery = handleMongoQuery(b)
    return {
      [`$${l.toLowerCase()}`]: [aQuery, bQuery],
    }
  })
  return {
    $and: allAndStatements,
  }
}

const doProperty = (p: PropertyStatement) => {
  return {
    [p.name]: p.value,
  }
}

const handleMongoQuery = (o: Tokens) => {
  if (Array.isArray(o)) {
    return processMongoArray(o)
  }
  if (o === 'AND' || o === 'OR') {
    throw new Error(``)
  }
  if (o.type === 'property') {
    return doProperty(o)
  }
  throw new Error('Unhandled currently')
}

const mongoMatch = (o: OverallQuery) => {
  return {
    $match: handleMongoQuery(o),
  }
}

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
