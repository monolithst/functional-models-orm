import {
  Arrayable,
  FunctionalValue,
  Maybe,
  ModelInstance,
  Model,
  FunctionalModel,
  PrimaryKeyType,
  ModelDefinition,
  OptionalModelOptions,
  ModelOptions,
  PropertyConfig,
  CreateParams,
  ValidatorConfiguration,
  TypedJsonObj,
  ModelFetcher,
} from 'functional-models/interfaces'

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
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> = (instance: TModelInstance) => Promise<TModelInstance>
type DeleteMethod<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> = (instance: TModelInstance) => Promise<void>
type SaveOverride<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> = (
  existingSave: SaveMethod<T, TModel, TModelInstance>,
  instance: TModelInstance
) => Promise<TModelInstance>
type DeleteOverride<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> = (
  existingDelete: DeleteMethod<T, TModel, TModelInstance>,
  instance: TModelInstance
) => Promise<void>

type OrmSearchResult<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> = Readonly<{
  instances: readonly TModelInstance[]
  page?: any
}>

type OrmOptionalModelOptions<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> =
  | (OptionalModelOptions<T> &
      Readonly<{
        save?: SaveOverride<T, TModel, TModelInstance>
        delete?: DeleteOverride<T, TModel, TModelInstance>
        uniqueTogether?: readonly string[]
        [s: string]: any
      }>)
  | undefined

type OrmModelOptions<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
> =
  | (ModelOptions<T> &
      Readonly<{
        save?: SaveOverride<T, TModel, TModelInstance>
        delete?: DeleteOverride<T, TModel, TModelInstance>
        [s: string]: any
      }>)
  | undefined

type OrmModelFactory = <
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >,
>(
  modelName: string,
  keyToProperty: ModelDefinition<T, TModel>,
  options?: OrmOptionalModelOptions<T, TModel, TModelInstance>
) => OrmModel<T>

type DatastoreSearchResult<T extends FunctionalModel> = Readonly<{
  instances: readonly TypedJsonObj<T>[]
  page?: any
}>

type OrmModel<T extends FunctionalModel> = Readonly<{
  save: (instance: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>
  delete: (instance: OrmModelInstance<T>) => Promise<void>
  retrieve: (primaryKey: PrimaryKeyType) => Promise<Maybe<OrmModelInstance<T>>>
  search: (query: OrmQuery) => Promise<OrmSearchResult<T, OrmModel<T>>>
  searchOne: (query: OrmQuery) => Promise<OrmModelInstance<T> | undefined>
  createAndSave: (data: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>
  bulkInsert: (instances: readonly OrmModelInstance<T>[]) => Promise<void>
  create: (data: CreateParams<T>) => OrmModelInstance<T>
  getModelDefinition: () => ModelDefinition<T, OrmModel<T>>
  count: () => Promise<number>
}> &
  Model<T>

type OrmModelInstance<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
> = {
  // eslint-disable-next-line functional/prefer-readonly-type
  save: () => Promise<OrmModelInstance<T, TModel>>
  // eslint-disable-next-line functional/prefer-readonly-type
  delete: () => Promise<void>
  readonly methods: Readonly<{
    isDirty: () => boolean
  }>
} & ModelInstance<T, TModel> &
  ModelInstance<T>

type DatastoreProvider = Readonly<{
  save: <
    T extends FunctionalModel,
    TModel extends Model<T> = OrmModel<T>,
    TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
  >(
    instance: TModelInstance
  ) => Promise<TypedJsonObj<T>>
  delete: <
    T extends FunctionalModel,
    TModel extends Model<T> = OrmModel<T>,
    TModelInstance extends ModelInstance<T, TModel> = ModelInstance<T, TModel>,
  >(
    instance: TModelInstance
  ) => Promise<void>
  retrieve: <T extends FunctionalModel>(
    model: OrmModel<T>,
    primaryKey: PrimaryKeyType
  ) => Promise<Maybe<TypedJsonObj<T>>>
  search: <T extends FunctionalModel>(
    model: OrmModel<T>,
    query: OrmQuery
  ) => Promise<DatastoreSearchResult<T>>
  bulkInsert?: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >,
  >(
    model: TModel,
    instances: readonly TModelInstance[]
  ) => Promise<void>
  createAndSave?: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >,
  >(
    instance: TModelInstance
  ) => Promise<TypedJsonObj<T>>
  count?: <T extends FunctionalModel, TModel extends OrmModel<T> = OrmModel<T>>(
    model: TModel
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

type OrmQueryStatement =
  | DatesAfterStatement
  | DatesBeforeStatement
  | SortStatement
  | TakeStatement
  | PaginationStatement
  | PropertyStatement
  | AndStatement
  | OrStatement

type OrmPropertyConfig<T extends Arrayable<FunctionalValue>> =
  PropertyConfig<T> &
    Readonly<{
      unique?: string
      [s: string]: any
    }>

type OrmValidatorConfiguration = Readonly<{
  noOrmValidation?: boolean
}> &
  ValidatorConfiguration

type OrmQueryBuilder = Readonly<{
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
  /**
   * @deprecated Use Model} instead.
   */
  BaseModel: OrmModelFactory
  fetcher: ModelFetcher
  datastoreProvider: DatastoreProvider
}

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
  OrmOptionalModelOptions,
  OrmModelFactory,
  SaveOverride,
  DeleteOverride,
  OrmModelOptions,
  OrmPropertyConfig,
  DatastoreSearchResult,
  OrmValidatorConfiguration,
  OrmQueryBuilder,
  OrmSearchResult,
  EQUALITY_SYMBOLS,
  ORMType,
  ALLOWABLE_EQUALITY_SYMBOLS,
  PropertyOptions,
  BuilderFlowFunction,
  Orm,
}
