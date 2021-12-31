import {
  Arrayable,
  FunctionalValue,
  Maybe,
  ModelInstance,
  Model,
  FunctionalModel,
  PrimaryKeyType,
  ModelInstanceInputData,
  ModelDefinition,
  OptionalModelOptions,
  ModelOptions,
  PropertyConfig,
  CreateParams,
  ValidatorConfiguration,
} from 'functional-models/interfaces'
import { EQUALITY_SYMBOLS, ORMType } from './constants'

type SaveMethod<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
> = (instance: TModelInstance) => Promise<TModelInstance>
type DeleteMethod<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
> = (instance: TModelInstance) => Promise<void>
type SaveOverride<
  T extends FunctionalModel,
  TModel extends OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
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
  >
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
  >
> = {
  readonly instances: readonly TModelInstance[]
  readonly page?: any
}

type OrmOptionalModelOptions<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
> =
  | (OptionalModelOptions<T> & {
      readonly save?: SaveOverride<T, TModel, TModelInstance>
      readonly delete?: DeleteOverride<T, TModel, TModelInstance>
      readonly [s: string]: any
    })
  | undefined

type OrmModelOptions<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
> =
  | (ModelOptions<T> & {
      readonly save?: SaveOverride<T, TModel, TModelInstance>
      readonly delete?: DeleteOverride<T, TModel, TModelInstance>
      readonly [s: string]: any
    })
  | undefined

type OrmModelFactory = <
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>,
  TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
    T,
    TModel
  >
>(
  modelName: string,
  keyToProperty: ModelDefinition<T, TModel, TModelInstance>,
  options?: OrmOptionalModelOptions<T, TModel, TModelInstance>
) => OrmModel<T>

type DatastoreSearchResult<T extends FunctionalModel> = {
  readonly instances: readonly ModelInstanceInputData<T>[]
  readonly page?: any
}

type OrmModel<T extends FunctionalModel> = {
  readonly save: (instance: OrmModelInstance<T>) => Promise<OrmModelInstance<T>>
  readonly delete: (instance: OrmModelInstance<T>) => Promise<void>
  readonly retrieve: (
    primaryKey: PrimaryKeyType
  ) => Promise<Maybe<OrmModelInstance<T>>>
  readonly search: (query: OrmQuery) => Promise<OrmSearchResult<T, OrmModel<T>>>
  readonly createAndSave: (
    data: OrmModelInstance<T>
  ) => Promise<OrmModelInstance<T>>
  readonly bulkInsert: (
    instances: readonly OrmModelInstance<T>[]
  ) => Promise<void>
  readonly create: (data: CreateParams<T>) => OrmModelInstance<T>
  readonly getModelDefinition: () => ModelDefinition<T, OrmModel<T>>
} & Model<T>

type OrmModelInstance<
  T extends FunctionalModel,
  TModel extends OrmModel<T> = OrmModel<T>
> = {
  // eslint-disable-next-line functional/prefer-readonly-type
  save: () => Promise<OrmModelInstance<T, TModel>>
  // eslint-disable-next-line functional/prefer-readonly-type
  delete: () => Promise<void>
  readonly methods: {
    readonly isDirty: () => boolean
  }
} & ModelInstance<T, TModel>

type DatastoreProvider = {
  readonly save: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    instance: TModelInstance
  ) => Promise<ModelInstanceInputData<T>>
  readonly delete: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    instance: TModelInstance
  ) => Promise<void>
  readonly retrieve: <T extends FunctionalModel>(
    model: OrmModel<T>,
    primaryKey: PrimaryKeyType
  ) => Promise<Maybe<ModelInstanceInputData<T>>>
  readonly search: <T extends FunctionalModel>(
    model: OrmModel<T>,
    query: OrmQuery
  ) => Promise<DatastoreSearchResult<T>>
  readonly bulkInsert?: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    model: TModel,
    instances: readonly TModelInstance[]
  ) => Promise<void>
  readonly createAndSave?: <
    T extends FunctionalModel,
    TModel extends OrmModel<T> = OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    instance: TModelInstance
  ) => Promise<ModelInstanceInputData<T>>
}

type PropertyStatement = {
  readonly type: 'property'
  readonly name: string
  readonly value: any
  readonly valueType: ORMType
  readonly options: {
    readonly caseSensitive?: boolean
    readonly startsWith?: boolean
    readonly endsWith?: boolean
    readonly equalitySymbol?: EQUALITY_SYMBOLS
  }
}

type PageValue = any
type TakeValue = number

type PaginationStatement = {
  readonly type: 'page'
  readonly value: PageValue
}

type TakeStatement = {
  readonly type: 'take'
  readonly value: TakeValue
}

type SortStatement = {
  readonly type: 'sort'
  readonly key: string
  readonly order: boolean
}

type DatesAfterStatement = {
  readonly type: 'datesAfter'
  readonly key: string
  readonly date: Date | string
  readonly valueType: ORMType
  readonly options: {
    readonly equalToAndAfter: boolean
  }
}

type DatesBeforeStatement = {
  readonly type: 'datesBefore'
  readonly key: string
  readonly date: Date | string
  readonly valueType: ORMType
  readonly options: {
    readonly equalToAndBefore: boolean
  }
}

type AndStatement = {
  readonly type: 'and'
}

type OrStatement = {
  readonly type: 'or'
}

type OrmQuery = {
  readonly properties: {
    readonly [s: string]: PropertyStatement
  }
  readonly datesAfter?: {
    readonly [s: string]: DatesAfterStatement
  }
  readonly datesBefore?: {
    readonly [s: string]: DatesBeforeStatement
  }
  readonly sort?: SortStatement
  readonly take?: TakeValue
  readonly page?: PageValue
  readonly chain: readonly OrmQueryStatement[]
}

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
  PropertyConfig<T> & {
    readonly unique?: string
    readonly uniqueTogether?: readonly string[]
    readonly [s: string]: any
  }

type OrmValidatorConfiguration = {
  readonly noOrmValidation?: boolean
} & ValidatorConfiguration

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
}
