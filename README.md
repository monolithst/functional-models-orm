# Functional Models ORM

![Unit Tests](https://github.com/monolithst/functional-models-orm/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models-orm/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models-orm/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models-orm?branch=master)

A basic library for building "object relationship mapper" libraries using the library functional-models.

## Requirements / How do i want this to function.

- Must be functional designed, no state/obj modification.
- `modelInstance.functions.save()` and it be saved into the database.
- `modelInstance.getMyReferencedModel()` and it automatically go fetch it from the database. (setting the fetchers automatically in the model-defs config)
- Want a standardized wrapper over the model functions to add orm.
- functional-models should not be interrupted what-so-ever from this. (must use meta or functions)
- Want to be able to do basic "param" based searching for a retrieveList.
- Want to know if a model is genuine from the database or not. (Is this dirty, to-be-saved?)

## CRUD Interface

The following is the way to do basic CRUD (create, retrieve, update, and delete).

### Create / Update

```
const ormConfig = {}       // ORM specific configurations
const modelConfig = {}     // Model specific configurations

// Create an orm instance
const myOrm = orm(ormConfig)

// Create your model class from the orm itself.
const Model = myOrm.createModel('Model2', {
  id: uniqueId(required: true),   // required for orm models!!!
  name: textField()
})

// Create a model as usual.
const modelInstance = Model({ name: 'hello world'})

// Was this created by code or by a datastore?
console.log(modelInstance.meta.dirty === true)     // true

// Save this to a datastore, get back a cleaned version of the model.
const savedModel = modelInstance.functions.save()

// Was this created by the datastore? yes. - No need to save again.
console.log(savedModel.meta.dirty === true)        // false
console.log(savedModel.functions.toObj())
/*
{
  id: 'generated-unique-id',
  name: 'hello world',
}
*/
```

Note: The implementation of an "update" is the same as create. Because of the "functional" nature of this library, objects cannot be "updated". This library would work well in a situation like a React/Redux that provides for a mechanism for distributing changed state throughout the application.

### Retrieve

```
// Retrieve the model instance by its id.
const model = await Model.retrieve('my-model-id')
console.log(model.meta.dirty === true)        // false, this is from the datastore.
```

### Retrieve Many (search)

```
// Retrieve many models by a query of the values.
const ormQuery = {} // see ORM Query.
const models = await Model.search(ormQuery)
```

### Delete

```
// deletes a model
await myModel.functions.delete(myModelInstance)
```
