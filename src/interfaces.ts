import {
  Arrayable,
  FunctionalType,
  Maybe,
  ModelInstance,
  Model,
  FunctionalModel,
  PrimaryKeyType,
  ModelInstanceInputData,
  ModelDefinition,
  OptionalModelOptions,
  ModelOptions, PropertyConfig, CreateParams,
} from 'functional-models/interfaces'

type SaveMethod<T extends FunctionalModel> = (instance: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>
type DeleteMethod<T extends FunctionalModel> = (instance: OrmModelInstance<T>) => Promise<void>
type SaveOverride<T extends FunctionalModel> = (existingSave: SaveMethod<T>, instance: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>
type DeleteOverride<T extends FunctionalModel> = (existingDelete: DeleteMethod<T>, instance: OrmModelInstance<T>) => Promise<void>

type OrmSearchResult<T extends FunctionalModel> = {
  readonly instances: readonly OrmModelInstance<T>[],
  readonly page?: any,
}

type OrmOptionalModelOptions<T extends FunctionalModel> = (OptionalModelOptions<T> & {
  readonly save?: SaveOverride<T>,
  readonly delete?: DeleteOverride<T>,
  readonly [s: string]: any,
}) | undefined

type OrmModelOptions<T extends FunctionalModel> = (ModelOptions<T> & {
  readonly save?: SaveOverride<T>,
  readonly delete?: DeleteOverride<T>,
  readonly [s: string]: any,
}) | undefined

type OrmModelFactory= <T extends FunctionalModel>(
  modelName: string,
  keyToProperty: ModelDefinition<T>,
  options?: OrmOptionalModelOptions<T>,
) => OrmModel<T>

type DatastoreSearchResult<T extends FunctionalModel> = {
  readonly instances: readonly ModelInstanceInputData<T>[],
  readonly page?: any,
}

type OrmModel<T extends FunctionalModel> = {
  readonly save: (instance: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>,
  readonly delete: (instance: OrmModelInstance<T>) => Promise<void>,
  readonly retrieve: (primaryKey: PrimaryKeyType) => Promise<Maybe<OrmModelInstance<T>>>,
  readonly search: (query: OrmQuery) => Promise<OrmSearchResult<T>>,
  readonly createAndSave: (data: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>,
  readonly bulkInsert: (instances: readonly OrmModelInstance<T>[]) => Promise<void>
  readonly create: (data: CreateParams<T>) => OrmModelInstance<T>
} & Model<T>

type OrmModelInstance<T extends FunctionalModel> = {
  save: () => Promise<OrmModelInstance<T>>,
  delete: () => Promise<void>,
  methods: {
    isDirty: () => boolean
  }
} & ModelInstance<T>

type DatastoreProvider = {
  save: <T extends FunctionalModel>(instance: OrmModelInstance<T>) => Promise<ModelInstanceInputData<T>>,
  delete: <T extends FunctionalModel>(instance: OrmModelInstance<T>) => Promise<void>,
  retrieve: <T extends FunctionalModel>(model: OrmModel<T>, primaryKey: PrimaryKeyType) => Promise<Maybe<ModelInstanceInputData<T>>>,
  search: <T extends FunctionalModel>(model: OrmModel<T>, query: OrmQuery) => Promise<DatastoreSearchResult<T>>,
  bulkInsert?: <T extends FunctionalModel>(model: OrmModel<T>, instances: readonly OrmModelInstance<T>[]) => Promise<void>,
  createAndSave?: <T extends FunctionalModel>(instance: OrmModelInstance<T>) => Promise<ModelInstanceInputData<T>>,
}

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


type OrmPropertyConfig<T extends Arrayable<FunctionalType>> = PropertyConfig<T> & {
  unique?: string,
  uniqueTogether?: readonly string[]
}


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
}