import merge from 'lodash/merge'
import { BaseModel as functionalModel, errors } from 'functional-models'
import {
  ModelFactory,
  Model,
  ModelFetcher,
  PrimaryKeyType,
  ModelDefinition,
  ModelInstanceInputData,
  FunctionalModel,
  ModelInstance,
  CreateParams,
  PropertyInstance,
} from 'functional-models/interfaces'
import {
  OrmModelInstance,
  OrmModel,
  DatastoreProvider,
  OrmQuery,
  OrmModelFactory,
  OrmOptionalModelOptions,
  SaveOverride,
  DeleteOverride,
  OrmModelOptions, TakeStatement,
} from './interfaces'

const { ValidationError } = errors
const isDirtyFalse = () => false
const isDirtyTrue = () => true

const orm = ({
  datastoreProvider,
  BaseModel = functionalModel,
}: {
  readonly datastoreProvider: DatastoreProvider
  readonly BaseModel?: ModelFactory
}) => {
  if (!datastoreProvider) {
    throw new Error(`Must include a datastoreProvider`)
  }

  const _retrievedObjToModel =
    <
      T extends FunctionalModel,
      TModel extends OrmModel<T>,
      TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
        T,
        TModel
      >
    >(
      model: TModel
    ) =>
    (obj: ModelInstanceInputData<T>): TModelInstance => {
      return merge(model.create(obj) as unknown as TModelInstance, {
        methods: {
          isDirty: isDirtyFalse,
        },
      })
    }

  // @ts-ignore
  const fetcher: ModelFetcher = <
    T extends FunctionalModel,
    TModel extends OrmModel<T>
  >(
    model: Model<T>,
    id: PrimaryKeyType
  ) => {
    // @ts-ignore
    return retrieve(model as TModel, id)
  }

  const retrieve = async <
    T extends FunctionalModel,
    TModel extends OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    model: TModel,
    id: PrimaryKeyType
  ) => {
    const obj = await datastoreProvider.retrieve(model, id)
    if (!obj) {
      return undefined
    }
    return _retrievedObjToModel<T, TModel, TModelInstance>(model)(obj)
  }

  const _defaultOptions = <
    T extends FunctionalModel,
    TModel extends OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(): OrmModelOptions<T, TModel, TModelInstance> => ({
    instanceCreatedCallback: null,
  })

  const _convertOptions = <
    T extends FunctionalModel,
    TModel extends OrmModel<T>,
    TModelInstance extends OrmModelInstance<T, TModel> = OrmModelInstance<
      T,
      TModel
    >
  >(
    options?: OrmOptionalModelOptions<T, TModel, TModelInstance>
  ) => {
    const r: OrmModelOptions<T, TModel, TModelInstance> = merge(
      {},
      _defaultOptions(),
      options
    )
    return r
  }

  const ThisModel: OrmModelFactory = <
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
  ) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // @ts-ignore
    // eslint-disable-next-line functional/no-let
    let model: TModel = null
    const theOptions = _convertOptions<T, TModel, TModelInstance>(options)

    const search = (ormQuery: OrmQuery) => {
      return datastoreProvider.search(model, ormQuery).then(result => {
        const conversionFunc = _retrievedObjToModel<T, TModel, TModelInstance>(
          model
        )
        return {
          instances: result.instances.map(conversionFunc),
          page: result.page,
        }
      })
    }

    const searchOne = (ormQuery: OrmQuery) => {
      ormQuery = merge(ormQuery, { take: 1 })
      return search(ormQuery)
        .then(({instances}) => {
          return instances[0]
        })
    }

    const bulkInsert = async (instances: readonly TModelInstance[]) => {
      if (datastoreProvider.bulkInsert) {
        await datastoreProvider.bulkInsert<T, TModel, TModelInstance>(
          model,
          instances
        )
        return undefined
      }
      await Promise.all(instances.map(x => x.save()))
      return undefined
    }

    const loadedRetrieve = (id: PrimaryKeyType) => {
      return retrieve<T, TModel, TModelInstance>(model, id)
    }

    const ormModelDefinitions = {
      instanceMethods: {
        isDirty: isDirtyTrue,
      },
    }

    const newKeyToProperty = merge({}, keyToProperty, ormModelDefinitions)

    const _updateLastModifiedIfExistsReturnNewObj = async (
      instance: TModelInstance
    ): Promise<TModelInstance> => {
      const hasLastModified = Object.entries(
        instance.getModel().getModelDefinition().properties
      ).filter(propertyEntry => {
        const property = propertyEntry[1] as PropertyInstance<any>
        return Boolean('lastModifiedUpdateMethod' in property)
      })[0]

      return hasLastModified
        ? // @ts-ignore
          (model.create(
            merge(await instance.toObj(), {
              [hasLastModified[0]]:
                // @ts-ignore
                hasLastModified[1].lastModifiedUpdateMethod(),
            })
          ) as TModelInstance)
        : instance
    }

    const save = async (instance: TModelInstance): Promise<TModelInstance> => {
      return Promise.resolve().then(async () => {
        const newInstance = await _updateLastModifiedIfExistsReturnNewObj(
          instance
        )
        const valid = await newInstance.validate()
        if (Object.keys(valid).length > 0) {
          throw new ValidationError(modelName, valid)
        }
        const savedObj = await datastoreProvider.save<T, TModel>(newInstance)
        return _retrievedObjToModel<T, TModel, TModelInstance>(model)(savedObj)
      })
    }

    const createAndSave = async (
      data: TModelInstance
    ): Promise<OrmModelInstance<T, TModel>> => {
      if (datastoreProvider.createAndSave) {
        const response = await datastoreProvider.createAndSave<T, TModel>(data)
        return _retrievedObjToModel<T, TModel, TModelInstance>(model)(response)
      }
      const instance = model.create(
        (await data.toObj()) as ModelInstanceInputData<T>
      ) as unknown as TModelInstance
      return instance.save()
    }

    const deleteObj = (instance: TModelInstance) => {
      return Promise.resolve().then(async () => {
        await datastoreProvider.delete<T, TModel, TModelInstance>(instance)
      })
    }

    const _getSave = (instance: TModelInstance) => {
      const thisModelOptions = instance.getModel().getOptions()
      // See if save has been overrided.
      if (thisModelOptions.save) {
        return () =>
          (thisModelOptions.save as SaveOverride<T, TModel, TModelInstance>)(
            save,
            instance
          )
      }
      return () => save(instance)
    }

    const _getDelete = (instance: TModelInstance) => {
      const thisModelOptions = instance.getModel().getOptions()
      if (thisModelOptions.delete) {
        return () =>
          (
            thisModelOptions.delete as DeleteOverride<T, TModel, TModelInstance>
          )(deleteObj, instance)
      }
      return () => deleteObj(instance)
    }

    const instanceCreatedCallback = (instance: ModelInstance<T, TModel>) => {
      const ormInstance = instance as TModelInstance
      // eslint-disable-next-line functional/immutable-data
      ormInstance.save = _getSave(ormInstance)
      // eslint-disable-next-line functional/immutable-data
      ormInstance.delete = _getDelete(ormInstance)
      if (theOptions.instanceCreatedCallback) {
        const callbacks: readonly ((
          instance: ModelInstance<T, TModel>
        ) => void)[] = Array.isArray(theOptions.instanceCreatedCallback)
          ? theOptions.instanceCreatedCallback
          : [theOptions.instanceCreatedCallback]
        callbacks.forEach(x => x(instance))
      }
    }
    // Absolutely do not put theOptions as the first argument. This first argument is what is modified,
    // therefore the instanceCreatedCallback keeps calling itself instead of wrapping.
    const overridedOptions = merge({}, theOptions, {
      instanceCreatedCallback: [instanceCreatedCallback],
    })
    const baseModel = BaseModel<T, TModel, TModelInstance>(
      modelName,
      newKeyToProperty,
      overridedOptions
    )
    const lowerLevelCreate = baseModel.create

    const _convertModelInstance = (
      instance: TModelInstance
    ): TModelInstance => {
      return merge(instance as TModelInstance, {
        methods: {
          isDirty: isDirtyTrue,
        },
        create,
        getModel: () => model as TModel,
        save: _getSave(instance as TModelInstance),
        delete: _getDelete(instance as TModelInstance),
      })
    }

    const create = (data: CreateParams<T>): TModelInstance => {
      const result = lowerLevelCreate(data)
      return _convertModelInstance(result as unknown as TModelInstance)
    }

    model = merge(baseModel, {
      getOptions: () => theOptions,
      create,
      save,
      delete: deleteObj,
      retrieve: loadedRetrieve,
      search,
      searchOne,
      createAndSave,
      bulkInsert,
    })
    return model
  }

  return {
    BaseModel: ThisModel,
    fetcher,
    datastoreProvider,
  }
}

export default orm
