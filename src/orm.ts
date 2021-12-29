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
  OrmModelOptions,
} from './interfaces'

const { ValidationError } = errors
const isDirtyFalse = () => false
const isDirtyTrue = () => true

const orm = ({
  datastoreProvider,
  BaseModel = functionalModel,
}: {
  readonly datastoreProvider: DatastoreProvider
  readonly BaseModel?: ModelFactory,
}) => {
  if (!datastoreProvider) {
    throw new Error(`Must include a datastoreProvider`)
  }

  const _retrievedObjToModel =
    <T extends FunctionalModel, TModel extends OrmModel<T>>(model: TModel) =>
    (obj: ModelInstanceInputData<T, any>): OrmModelInstance<T, TModel> => {
      return merge(model.create(obj) as unknown as OrmModelInstance<T, TModel>, {
        methods: {
          isDirty: isDirtyFalse,
        },
      })
    }

  const fetcher: ModelFetcher = <T extends FunctionalModel, TModel extends OrmModel<T>>(
    model: Model<T>,
    id: PrimaryKeyType
  ) => {
    // @ts-ignore
    return retrieve(model as TModel, id)
  }

  const retrieve = async <T extends FunctionalModel, TModel extends OrmModel<T>>(
    model: TModel,
    id: PrimaryKeyType
  ) => {
    const obj = await datastoreProvider.retrieve(model, id)
    if (!obj) {
      return undefined
    }
    return _retrievedObjToModel<T, TModel>(model)(obj)
  }

  const _defaultOptions = <
    T extends FunctionalModel, TModel extends OrmModel<T>
  >(): OrmModelOptions<T, TModel> => ({
    instanceCreatedCallback: null,
  })

  const _convertOptions = <T extends FunctionalModel, TModel extends OrmModel<T>>(
    options?: OrmOptionalModelOptions<T, TModel>
  ) => {
    const r: OrmModelOptions<T, TModel> = merge({}, _defaultOptions(), options)
    return r
  }

  const ThisModel: OrmModelFactory = <T extends FunctionalModel, TModel extends OrmModel<T> = OrmModel<T>>(
    modelName: string,
    keyToProperty: ModelDefinition<T, TModel>,
    options?: OrmOptionalModelOptions<T, TModel>
  ) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // @ts-ignore
    // eslint-disable-next-line functional/no-let
    let model: TModel = null
    const theOptions = _convertOptions<T, TModel>(options)

    const search = (ormQuery: OrmQuery) => {
      return datastoreProvider.search(model, ormQuery).then(result => {
        const conversionFunc = _retrievedObjToModel<T, TModel>(model)
        return {
          instances: result.instances.map(conversionFunc),
          page: result.page,
        }
      })
    }

    const bulkInsert = async (instances: readonly OrmModelInstance<T>[]) => {
      if (datastoreProvider.bulkInsert) {
        await datastoreProvider.bulkInsert(model, instances)
        return undefined
      }
      await Promise.all(instances.map(x => x.save()))
      return undefined
    }

    const loadedRetrieve = (id: PrimaryKeyType) => {
      return retrieve<T, TModel>(model, id)
    }

    const ormModelDefinitions = {
      instanceMethods: {
        isDirty: isDirtyTrue,
      },
    }

    const newKeyToProperty = merge({}, keyToProperty, ormModelDefinitions)

    const _updateLastModifiedIfExistsReturnNewObj = async (
      instance: OrmModelInstance<T, TModel>
    ): Promise<OrmModelInstance<T, TModel>> => {
      const hasLastModified = Object.entries(
        instance.getModel().getModelDefinition().properties
      ).filter(propertyEntry => {
        const property = propertyEntry[1] as PropertyInstance<any>
        return Boolean('lastModifiedUpdateMethod' in property)
      })[0]

      return hasLastModified
        ? // @ts-ignore
          (model.create(
            merge((await instance.toObj()) as {}, {
              [hasLastModified[0]]:
                // @ts-ignore
                hasLastModified[1].lastModifiedUpdateMethod(),
            })
          ) as OrmModelInstance<T, TModel>)
        : instance
    }

    const save = async (
      instance: OrmModelInstance<T, TModel>
    ): Promise<OrmModelInstance<T, TModel>> => {
      return Promise.resolve().then(async () => {
        const newInstance = await _updateLastModifiedIfExistsReturnNewObj(
          instance
        )
        const valid = await newInstance.validate()
        if (Object.keys(valid).length > 0) {
          throw new ValidationError(modelName, valid)
        }
        const savedObj = await datastoreProvider.save(newInstance)
        return _retrievedObjToModel<T, TModel>(model)(savedObj)
      })
    }

    const createAndSave = async (
      data: OrmModelInstance<T, TModel>
    ): Promise<OrmModelInstance<T, TModel>> => {
      if (datastoreProvider.createAndSave) {
        const response = await datastoreProvider.createAndSave(data)
        return _retrievedObjToModel<T, TModel>(model)(response)
      }
      const instance = model.create(
        (await data.toObj()) as ModelInstanceInputData<T, any>
      ) as unknown as OrmModelInstance<T, TModel>
      return instance.save()
    }

    const deleteObj = (instance: OrmModelInstance<T, TModel>) => {
      return Promise.resolve().then(async () => {
        await datastoreProvider.delete(instance)
      })
    }

    const _getSave = (instance: OrmModelInstance<T, TModel>) => {
      const thisModelOptions = instance.getModel().getOptions()
      // See if save has been overrided.
      if (thisModelOptions.save) {
        return () => (thisModelOptions.save as SaveOverride<T, TModel>)(save, instance)
      }
      return () => save(instance)
    }

    const _getDelete = (instance: OrmModelInstance<T, TModel>) => {
      const thisModelOptions = instance.getModel().getOptions()
      if (thisModelOptions.delete) {
        return () =>
          (thisModelOptions.delete as DeleteOverride<T, TModel>)(deleteObj, instance)
      }
      return () => deleteObj(instance)
    }

    const instanceCreatedCallback = (instance: ModelInstance<T, TModel>) => {
      const ormInstance = instance as OrmModelInstance<T, TModel>
      // eslint-disable-next-line functional/immutable-data
      ormInstance.save = _getSave(ormInstance)
      // eslint-disable-next-line functional/immutable-data
      ormInstance.delete = _getDelete(ormInstance)
      if (theOptions.instanceCreatedCallback) {
        const callbacks: readonly ((instance: ModelInstance<T, TModel>) => void)[] =
          Array.isArray(theOptions.instanceCreatedCallback)
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
    const baseModel = BaseModel<T, TModel>(
      modelName,
      newKeyToProperty,
      overridedOptions
    )
    const lowerLevelCreate = baseModel.create

    const _convertModelInstance = (
      instance: OrmModelInstance<T, TModel>
    ): OrmModelInstance<T, TModel> => {
      return merge(instance as OrmModelInstance<T, TModel>, {
        methods: {
          isDirty: isDirtyTrue,
        },
        create,
        getModel: () => model as TModel,
        save: _getSave(instance as OrmModelInstance<T, TModel>),
        delete: _getDelete(instance as OrmModelInstance<T, TModel>),
      })
    }

    const create = (data: CreateParams<T, any>): OrmModelInstance<T, TModel> => {
      const result = lowerLevelCreate(data)
      return _convertModelInstance(result as unknown as OrmModelInstance<T, TModel>)
    }

    model = merge(baseModel, {
      getOptions: () => theOptions,
      create,
      save,
      delete: deleteObj,
      retrieve: loadedRetrieve,
      search,
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
