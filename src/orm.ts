import merge from 'lodash/merge'
import get from 'lodash/get'
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
const _instanceProperties = {
  meta: {
    isDirty: isDirtyTrue,
  },
}

const orm = ({ datastoreProvider, BaseModel = functionalModel }: { datastoreProvider: DatastoreProvider, BaseModel?: ModelFactory }) => {
  if (!datastoreProvider) {
    throw new Error(`Must include a datastoreProvider`)
  }

  const _retrievedObjToModel = <T extends FunctionalModel>(model: Model<T>) => (obj: ModelInstanceInputData<T>) : OrmModelInstance<T> => {
    const keyToProperty = merge({}, obj, {
      meta: {
        isDirty: isDirtyFalse,
      },
    })
    return model.create(keyToProperty) as OrmModelInstance<T>
  }

  const fetcher : ModelFetcher = <T extends FunctionalModel>(model: Model<T>, id: PrimaryKeyType) => {
    return retrieve(model as OrmModel<T>)(id)
  }

  const retrieve = <T extends FunctionalModel>(model: OrmModel<T>) => async (id: PrimaryKeyType) => {
    const obj = await datastoreProvider.retrieve(model, id)
    if (!obj) {
      return undefined
    }
    return _retrievedObjToModel(model)(obj)
  }

  const bulkInsert = <T extends FunctionalModel>(model: OrmModel<T>) => async (instances: readonly OrmModelInstance<T>[]) => {
    if (datastoreProvider.bulkInsert) {
      await datastoreProvider.bulkInsert(model, instances)
      return undefined
    } 
      await Promise.all(instances.map(x=>x.save()))
      return undefined
  }

  const _defaultOptions = <T extends FunctionalModel>(): OrmModelOptions<T> => ({
    instanceCreatedCallback: null,
  })

  const _convertOptions = <T extends FunctionalModel>(options?: OrmOptionalModelOptions<T>) => {
    const r: OrmModelOptions<T> = merge({}, _defaultOptions(), options)
    return r
  }

  const ThisModel : OrmModelFactory = <T extends FunctionalModel>(
    modelName: string,
    keyToProperty: ModelDefinition<T>,
    options?: OrmOptionalModelOptions<T>
  ) => {
    /*
    NOTE: We need access to the model AFTER its built, so we have to have this state variable.
    It has been intentionally decided that recreating the model each and every time for each database retrieve is
    too much cost to obtain "functional purity". This could always be reverted back.
    */
    // eslint-disable-next-line functional/no-let
    // @ts-ignore
    let model : OrmModel<T> = null
    const theOptions = _convertOptions(options)

    const search = (ormQuery: OrmQuery) => {
      return datastoreProvider.search(model, ormQuery).then(result => {
        return {
          instances: result.instances.map(_retrievedObjToModel(model)),
          page: result.page,
        }
      })
    }

    const ormModelDefinitions = {
      instanceMethods: {
        isDirty: isDirtyTrue
      }
    }

    const newKeyToProperty = merge({}, keyToProperty, ormModelDefinitions)

    const _updateLastModifiedIfExistsReturnNewObj = async (instance: OrmModelInstance<T>) : Promise<OrmModelInstance<T>> => {
      const hasLastModified = Object.entries(
        instance.getModel().getModelDefinition().properties
      ).filter(([_, property]) => Boolean('lastModifiedUpdateMethod' in property))[0]

      return hasLastModified
        // @ts-ignore
        ? model.create(merge(await instance.toObj() as {}, {[hasLastModified[0]]:
          // @ts-ignore
            hasLastModified[1].lastModifiedUpdateMethod(),
        })) as OrmModelInstance<T>
        : instance
    }

    const save = async (instance: OrmModelInstance<T>) : Promise<OrmModelInstance<T>> => {
      return Promise.resolve().then(async () => {
        const newInstance = await _updateLastModifiedIfExistsReturnNewObj(instance)
        const valid = await newInstance.validate()
        if (Object.keys(valid).length > 0) {
          throw new ValidationError(modelName, valid)
        }
        const savedObj = await datastoreProvider.save(newInstance)
        return _retrievedObjToModel(model)(savedObj)
      })
    }

    const createAndSave = async (data: OrmModelInstance<T>) : Promise<OrmModelInstance<T>> => {
      if (datastoreProvider.createAndSave) {
        const response = await datastoreProvider.createAndSave(data)
        return _retrievedObjToModel(model)(response)
      } else {
        const inputData : ModelInstanceInputData<T> = await data.toObj()
        const instance = model.create((await data.toObj()) as ModelInstanceInputData<T>) as OrmModelInstance<T>
        return instance.save()
      }
    }

    const deleteObj = (instance: OrmModelInstance<T>) => {
      return Promise.resolve().then(async () => {
        await datastoreProvider.delete(instance)
      })
    }

    const _getSave = (instance: OrmModelInstance<T>) => {
      const thisModelOptions = instance.getModel().getOptions()
      // See if save has been overrided.
      if (thisModelOptions.save) {
        return () => (thisModelOptions.save as SaveOverride<T>)(save, instance)
      } else {
        // eslint-disable-next-line functional/immutable-data
        return () => save(instance)
      }
    }

    const _getDelete = (instance: OrmModelInstance<T>) => {
      const thisModelOptions = instance.getModel().getOptions()
      if (thisModelOptions.delete) {
        return () => (thisModelOptions.delete as DeleteOverride<T>)(deleteObj, instance)
      } else {
        // eslint-disable-next-line functional/immutable-data
        return () => deleteObj(instance)
      }
    }

    const instanceCreatedCallback = (instance: ModelInstance<T>) => {
      const ormInstance = instance as OrmModelInstance<T>
      ormInstance.save = _getSave(ormInstance)
      ormInstance.delete = _getDelete(ormInstance)
      if (theOptions.instanceCreatedCallback) {
        const callbacks : readonly ((instance: ModelInstance<T>) => void)[] = Array.isArray(theOptions.instanceCreatedCallback)
          ? theOptions.instanceCreatedCallback
          : [theOptions.instanceCreatedCallback]
        callbacks.forEach(x => x(instance))
      }
    }
    const overridedOptions = merge(theOptions.instanceCreatedCallback, { instanceCreatedCallback: instanceCreatedCallback })
    const baseModel = BaseModel<T>(modelName, newKeyToProperty, overridedOptions)

    const _convertModelInstance = (instance: ModelInstance<T>) : OrmModelInstance<T> => {
      return merge(
        instance,
        {
          methods: {
            isDirty: isDirtyTrue
          },
          create,
          save: _getSave(instance as OrmModelInstance<T>),
          delete: _getDelete(instance as OrmModelInstance<T>),
        }
      )
    }

    const create = (data: CreateParams<T>) : OrmModelInstance<T> => {
      const result = baseModel.create(data)
      return _convertModelInstance(result)
    }

    model = merge(
      BaseModel(modelName, newKeyToProperty, options), {
        create,
        save,
        delete: deleteObj,
        retrieve: retrieve(model),
        search,
        createAndSave,
        bulkInsert: bulkInsert(model),
      }
    )
    return model
  }

  return {
    BaseModel: ThisModel,
    fetcher,
    datastoreProvider,
  }
}

export default orm
