enum EQUALITY_SYMBOLS {
  EQUALS='=',
  LT='<',
  LTE='<=',
  GT='>',
  GTE='>=',
}

const ALLOWABLE_EQUALITY_SYMBOLS = Object.values(EQUALITY_SYMBOLS)

type PropertyStatement = {
  type: 'property',
  name: string,
  value: any,
  valueType: ORMType,
  options: {
    caseSensitive: boolean,
    startsWith: boolean,
    endsWith: boolean,
    equalitySymbol: EQUALITY_SYMBOLS,
  }
}

type PageValue = any
type TakeValue = number


type PaginationStatement = {
  type: 'page',
  value: PageValue,
}

type TakeStatement = {
  type: 'take',
  value: TakeValue,
}

type SortStatement = {
  type: 'sort',
  key: string,
  order: boolean,
}

type DatesAfterStatement = {
  type: 'datesAfter',
  key: string,
  date: Date|string,
  valueType: ORMType,
  options: {
    equalToAndAfter: boolean,
  }
}

type DatesBeforeStatement = {
  type: 'datesBefore',
  key: string,
  date: Date|string,
  valueType: ORMType,
  options: {
    equalToAndBefore: boolean,
  }
}

type AndStatement = {
  type: 'and',
}

type OrStatement = {
  type: 'or',
}

type OrmQuery = {
  properties: {
    [s: string]: PropertyStatement
  },
  datesAfter?: {
    [s: string]: DatesAfterStatement,
  },
  datesBefore?: {
    [s: string]: DatesBeforeStatement,
  },
  sort?: SortStatement,
  take?: TakeValue,
  page?: PageValue,
  chain: OrmQueryStatement[],
}

enum ORMType {
  string='string',
  number='number',
  date='date',
  object='object',
  boolean='boolean',
}


type OrmQueryStatement = DatesAfterStatement |
  DatesBeforeStatement |
  SortStatement |
  TakeStatement |
  PaginationStatement |
  PropertyStatement |
  AndStatement |
  OrStatement


export {
  OrmQuery,
  EQUALITY_SYMBOLS,
  OrmQueryStatement,
  OrStatement,
  AndStatement,
  PropertyStatement,
  SortStatement,
  DatesAfterStatement,
  DatesBeforeStatement,
  PaginationStatement,
  TakeStatement,
  ORMType,
  ALLOWABLE_EQUALITY_SYMBOLS,
}