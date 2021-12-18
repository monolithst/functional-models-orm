enum EQUALITY_SYMBOLS {
  EQUALS = '=',
  LT = '<',
  LTE = '<=',
  GT = '>',
  GTE = '>=',
}

enum ORMType {
  string = 'string',
  number = 'number',
  date = 'date',
  object = 'object',
  boolean = 'boolean',
}

const ALLOWABLE_EQUALITY_SYMBOLS = Object.values(EQUALITY_SYMBOLS)

export { EQUALITY_SYMBOLS, ALLOWABLE_EQUALITY_SYMBOLS, ORMType }
