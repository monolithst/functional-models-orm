import {
  Arrayable,
  DataValue,
  Maybe,
  ModelInstance,
  ModelType,
  DataDescription,
  PrimaryKeyType,
  MinimalModelDefinition,
  PropertyConfig,
  ValidatorContext,
  ToObjectResult,
  ModelInstanceFetcher,
  ModelFactory,
  ModelDefinition,
  ModelFactoryOptions,
} from 'functional-models'

enum EqualitySymbol {
  eq = '=',
  lt = '<',
  lte = '<=',
  gt = '>',
  gte = '>=',
}

enum ORMType {
  string = 'string',
  number = 'number',
  date = 'date',
  object = 'object',
  boolean = 'boolean',
}

const AllowableEqualitySymbols = Object.values(EqualitySymbol)

type SaveMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

type DeleteMethod<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<void>

type SaveOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingSave: SaveMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
) => Promise<
  OrmModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
>

type DeleteOverride<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = <TData extends DataDescription>(
  existingDelete: DeleteMethod<TModelExtensions, TModelInstanceExtensions>,
  instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
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

type OrmModelFactoryOptionsExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  save?: SaveOverride<TModelExtensions, TModelInstanceExtensions>
  delete?: DeleteOverride<TModelExtensions, TModelInstanceExtensions>
}>

type OrmModelExtensions<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
> = Readonly<{
  getOrmModelConfigurations: () => OrmModelConfigurations
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
}>

type OrmModelFactory1<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
  TModelOptionsExtensions extends object = object,
> = ModelFactory<
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelFactoryOptionsExtensions<TModelOptionsExtensions>
>

type OrmModelConfigurations = Readonly<{
  uniqueTogether?: readonly string[]
}>

type MinimumOrmModelDefinition<TData extends DataDescription> =
  MinimalModelDefinition<TData> & OrmModelConfigurations

type OrmModelFactory<
  TModelExtensions extends object = object,
  TModelInstanceExtensions extends object = object,
  TModelOptionsExtensions extends object = object,
> = <TData extends DataDescription>(
  modelDef: MinimumOrmModelDefinition<TData>,
  options?: ModelFactoryOptions<
    TData,
    OrmModelFactoryOptionsExtensions<
      TModelExtensions,
      TModelInstanceExtensions
    > &
      TModelOptionsExtensions
  >
) => ModelType<
  TData,
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
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
  OrmModelExtensions<TModelExtensions, TModelInstanceExtensions>,
  OrmModelInstanceExtensions<TModelExtensions, TModelInstanceExtensions>
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
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
  ) => Promise<ToObjectResult<TData>>
  delete: <
    TData extends DataDescription,
    TModelExtensions extends object = object,
    TModelInstanceExtensions extends object = object,
  >(
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
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
    instances: readonly ModelInstance<
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
    instance: ModelInstance<TData, TModelExtensions, TModelInstanceExtensions>
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
    equalitySymbol?: EqualitySymbol
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
      equalitySymbol?: EqualitySymbol
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
  equalitySymbol?: EqualitySymbol
}

type BuilderFlowFunction = (builder: OrmQueryBuilder) => OrmQueryBuilder

type Orm = {
  Model: OrmModelFactory
  fetcher: ModelInstanceFetcher<OrmModelExtensions, OrmModelInstanceExtensions>
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
  OrmModelFactory,
  SaveOverride,
  DeleteOverride,
  OrmPropertyConfig,
  DatastoreSearchResult,
  OrmValidatorContext,
  OrmQueryBuilder,
  OrmSearchResult,
  EqualitySymbol,
  ORMType,
  AllowableEqualitySymbols,
  PropertyOptions,
  BuilderFlowFunction,
  Orm,
  BooleanChains,
  OrmModelExtensions,
  OrmModelInstanceExtensions,
  OrmModelFactoryOptionsExtensions,
  MinimumOrmModelDefinition,
}
