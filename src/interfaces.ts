import {
  Arrayable,
  DataValue,
  Maybe,
  ModelInstance,
  ModelType,
  DataDescription,
  PrimaryKeyType,
  PropertyConfig,
  ValidatorContext,
  ToObjectResult,
  ModelInstanceFetcher,
  ModelFactory,
  PropertyType,
} from 'functional-models'

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

type SaveMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  instance: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

type DeleteMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  instance: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<void>

type SaveOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingSave: SaveMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

type DeleteOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingDelete: DeleteMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<void>

type OrmSearchResult<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  instances: readonly OrmModelInstance<
    TData,
    TModelExtensions,
    TModelInstanceExtensions
  >[]
  page?: any
}>

type OrmModelOptionsExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  save?: SaveOverride<TModelExtensions, TModelInstanceExtensions>
  delete?: DeleteOverride<TModelExtensions, TModelInstanceExtensions>
  uniqueTogether?: readonly string[]
}>

type OrmModelExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  save: <TData extends DataDescription>(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  delete: <TData extends DataDescription>(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<void>
  retrieve: <TData extends DataDescription>(
    primaryKey: PrimaryKeyType
  ) => Promise<
    Maybe<OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>>
  >
  search: <TData extends DataDescription>(
    query: OrmQuery
  ) => Promise<
    OrmSearchResult<
      TData,
      OrmModel<TData, TModelExtensions, TModelInstanceExtensions>
    >
  >
  searchOne: <TData extends DataDescription>(
    query: OrmQuery
  ) => Promise<
    | OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
    | undefined
  >
  createAndSave: <TData extends DataDescription>(
    data: OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  bulkInsert: <TData extends DataDescription>(
    instances: readonly OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >[]
  ) => Promise<void>
  count: () => Promise<number>
}>

type OrmModelInstanceExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  save: <TData extends DataDescription>() => Promise<
    OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  >
  delete: () => Promise<void>
  methods: Readonly<{
    isDirty: () => boolean
  }>
}>

type OrmModelFactory<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
  TModelOptionsExtensions extends object = object,
> = ModelFactory<
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelOptionsExtensions<TModelOptionsExtensions>
>

type DatastoreSearchResult<T extends DataDescription> = Readonly<{
  instances: readonly ToObjectResult<T>[]
  page?: any
}>

type OrmModel<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = ModelType<
  TData,
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>
>

type OrmModelInstance<
  TData extends DataDescription,
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = ModelInstance<
  TData,
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
>

type DatastoreProvider = Readonly<{
  save: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<ToObjectResult<TData>>
  delete: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<void>
  retrieve: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    primaryKey: PrimaryKeyType
  ) => Promise<Maybe<ToObjectResult<TData>>>
  search: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    query: OrmQuery
  ) => Promise<DatastoreSearchResult<TData>>
  bulkInsert?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>,
    instances: readonly OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >[]
  ) => Promise<void>
  createAndSave?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: OrmModelInstance<
      TData,
      TModelExtensions,
      TModelInstanceExtensions
    >
  ) => Promise<ToObjectResult<TData>>
  count?: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    model: OrmModel<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<number>
}>

type PropertyStatement = Readonly<{
  type: 'property'
  name: string
  value: any
  valueType: ORMType
  options: {
    caseSensitive?: boolean
    startsWith?: boolean
    endsWith?: boolean
    equalitySymbol?: EQUALITY_SYMBOLS
  }
}>

type PageValue = any
type TakeValue = number

type PaginationStatement = Readonly<{
  type: 'page'
  value: PageValue
}>

type TakeStatement = Readonly<{
  type: 'take'
  value: TakeValue
}>

type SortStatement = Readonly<{
  type: 'sort'
  key: string
  order: boolean
}>

type DatesAfterStatement = Readonly<{
  type: 'datesAfter'
  key: string
  date: Date | string
  valueType: ORMType
  options: {
    equalToAndAfter: boolean
  }
}>

type DatesBeforeStatement = Readonly<{
  type: 'datesBefore'
  key: string
  date: Date | string
  valueType: ORMType
  options: {
    equalToAndBefore: boolean
  }
}>

type AndStatement = Readonly<{
  type: 'and'
}>

type OrStatement = Readonly<{
  type: 'or'
}>

type OrmQuery = Readonly<{
  properties: {
    readonly [s: string]: PropertyStatement
  }
  datesAfter?: {
    readonly [s: string]: DatesAfterStatement
  }
  datesBefore?: {
    readonly [s: string]: DatesBeforeStatement
  }
  sort?: SortStatement
  take?: TakeValue
  page?: PageValue
  chain: readonly OrmQueryStatement[]
}>

type OrChain = {}

type LinkStatement = {
  statements: OrmQueryStatement[]
  link: 'and' | 'or'
}

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
    equalitySymbol = EQUALITY_SYMBOLS.EQUALS,
  }: PropertyOptions = {}
) => {
  if (!ALLOWABLE_EQUALITY_SYMBOLS.includes(equalitySymbol)) {
    throw new Error(`${equalitySymbol} is not a valid symbol`)
  }
  if (equalitySymbol !== EQUALITY_SYMBOLS.EQUALS && type === ORMType.string) {
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
    [property('s4', 'abc'), 'AND', property('s5', '098')],
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

type QueryStatement = {
  andStatements: QueryStatement[]
  orStatements: QueryStatement[]
  thisStatement: OrmQueryStatement
}

type OrmQuery2 = Readonly<{
  andStatements: QueryStatement[]
  sort?: SortStatement
  take?: TakeValue
  page?: PageValue
}>

type OrmQueryStatement =
  | DatesAfterStatement
  | DatesBeforeStatement
  | SortStatement
  | TakeStatement
  | PaginationStatement
  | PropertyStatement
  | AndStatement
  | OrStatement

type OrmPropertyConfig<T extends Arrayable<DataValue>> = PropertyConfig<T> &
  Readonly<{
    unique?: string
    [s: string]: any
  }>

type OrmValidatorContext = Readonly<{
  noOrmValidation?: boolean
}> &
  ValidatorContext

type OrmQueryBuilder = Readonly<{
  /*TODO:
  In the next major iteration we need to add the concept of a complexStatement()
  A complex statement allows for nested AND/OR statements.
  */
  compile: () => OrmQuery
  datesAfter: (
    key: string,
    jsDate: Date | string,
    {
      valueType,
      equalToAndAfter,
    }: { valueType?: ORMType; equalToAndAfter?: boolean }
  ) => OrmQueryBuilder
  datesBefore: (
    key: string,
    jsDate: Date | string,
    {
      valueType,
      equalToAndBefore,
    }: { valueType?: ORMType; equalToAndBefore?: boolean }
  ) => OrmQueryBuilder
  property: (
    name: string,
    value: any,
    {
      caseSensitive,
      startsWith,
      endsWith,
      type,
      equalitySymbol,
    }?: {
      caseSensitive?: boolean
      startsWith?: boolean
      endsWith?: boolean
      type?: ORMType
      equalitySymbol?: EQUALITY_SYMBOLS
    }
  ) => OrmQueryBuilder
  pagination: (value: any) => OrmQueryBuilder
  sort: (key: string, isAscending?: boolean) => OrmQueryBuilder
  take: (count: number) => OrmQueryBuilder
  and: () => OrmQueryBuilder
  or: () => OrmQueryBuilder
}>

type PropertyOptions = {
  caseSensitive?: boolean
  startsWith?: boolean
  endsWith?: boolean
  type?: ORMType
  equalitySymbol?: EQUALITY_SYMBOLS
}

type BuilderFlowFunction = (builder: OrmQueryBuilder) => OrmQueryBuilder

type Orm = {
  Model: OrmModelFactory
  fetcher: ModelInstanceFetcher
  datastoreProvider: DatastoreProvider
}

type BooleanChains = Readonly<{
  ands: (PropertyStatement | DatesBeforeStatement | DatesAfterStatement)[]
  orChains: PropertyStatement[][]
}>

export {
  OrmQuery,
  OrmQueryStatement,
  OrStatement,
  AndStatement,
  PropertyStatement,
  SortStatement,
  DatesAfterStatement,
  DatesBeforeStatement,
  PaginationStatement,
  TakeStatement,
  OrmModel,
  OrmModelInstance,
  DatastoreProvider,
  OrmModelOptions,
  OrmModelFactory,
  SaveOverride,
  DeleteOverride,
  OrmPropertyConfig,
  DatastoreSearchResult,
  OrmValidatorContext,
  OrmQueryBuilder,
  OrmSearchResult,
  EQUALITY_SYMBOLS,
  ORMType,
  ALLOWABLE_EQUALITY_SYMBOLS,
  PropertyOptions,
  BuilderFlowFunction,
  Orm,
  BooleanChains,
}
