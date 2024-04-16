# Functional Models ORM

![Unit Tests](https://github.com/monolithst/functional-models-orm/actions/workflows/ut.yml/badge.svg?branch=master)
![Feature Tests](https://github.com/monolithst/functional-models-orm/actions/workflows/feature.yml/badge.svg?branch=master)
[![Coverage Status](https://coveralls.io/repos/github/monolithst/functional-models-orm/badge.svg?branch=master)](https://coveralls.io/github/monolithst/functional-models-orm?branch=master)

The backbone library for building an object relationship mapper (ORM) for [functional-models](https://github.com/monolithst/functional-models).
The primary extensions to this library relate to the "DatastoreProvider" which is effectively a database backing. To date the following are DatastoreProvider's available.

- [AWS DynamoDB](https://github.com/monolithst/functional-models-orm-dynamo).
- [MongoDB / DocumentDB](https://github.com/monolithst/functional-models-orm-mongo).

## General Design

This ORM is designed to be able to provide the following standardized capabilities.

- Functional Paradigm (no state changes / object modifications, wherever possible).
- Standardized way to do most common database searches in code, rather than db specific query writing
- Ability to support auto-serialize with nested model instances, via a Model Reference and "foreign keys"

## Supported Queries/Operations

Out of the box the primary interfaces for a DatastoreProvider are the following

- save
- delete (one)
- retrieve (one)
- search
- searchOne\*\*
- bulkInsert\*\*
- createAndSave\*\*

\*\* These interfaces, if not defined, rely on in-memory logic to perform the operation. These however, can be overrided to provide a database specific way of doing this kind of query.

## General Design.

To use the orm, all one needs is a configured DatastoreProvider. Once this is passed into the orm module, the orm gives access to function such as `BaseModel`, which is a replacement BaseModel found in functional-models. This is why you will see a BaseModel, passed into a models module. All of the overriding an providing the deep functional is done through the BaseModel. This allows any functional-models BaseModel, to be added to an orm, usually with no changes.

## Examples

The following are some basic use examples. Depending on the DatastoreProvider implementation, additional setup may be required.

### Setup

```
import { orm } from 'functional-models-orm'

// Custom configurations, based on provider
const datastoreProviderConfig = {}
const datastoreProvider = myDatastoreProviderFactory(datastoreProviderConfig)

// Create an instance of the orm, so that it gives you access to the BaseModel.
const myOrm = orm({
  datastoreProvider
})

// Create an instance of your models, using the BaseModel as the backing.
const myModels = models({ BaseModel: myOrm.BaseModel })

// Now your models are database backed.
```

### Create / Update

```
import { UniqueId, TextProperty } from 'functional-models'
import { orm } from 'functional-models-orm'
// Create an orm instance
const myOrm = orm({ datastoreProvider })

// Create your model class from the orm itself, just like with functional-models
const Trains = myOrm.BaseModel('Trains', {
  // id: UniqueId({ required: true} ),   # No need to do, automatically provided
  name: TextProperty()
})

// Create a model as usual.
const modelInstance = Trains.create({ name: 'Yellow Train'})

// Save this to a datastore, get back a cleaned version of the model.
const savedModel = await modelInstance.save()

console.log(await savedModel.toObj())
/*
{
  id: 'generated-unique-id',
  name: 'hello world',
}
*/
```

Note: The implementation of an "update" is the same as create. Because of the "functional" nature of this library, objects cannot be "updated". This library would work well in a situation like a React/Redux that provides for a mechanism for distributing changed state throughout the application.

### Retrieve (one, via primary key)

```
// Retrieve the model instance by its id.
const modelInstance = await Trains.retrieve('my-model-id')
```

### Search (Retrieve Many)

```
import { ormQuery } from 'functional-models-orm'

// Create an orm query. Note this is a very simplified example.
const query = ormQuery.ormQueryBuilder()
    .property('name', 'hello', { startsWith: true })
    .compile()

const searchResults = await Trains.search(query)
console.log(searchResults)
/*
{
  page: undefined,  // if there is a multi-page situation, this is the DatastoreProvider specific object, for getting the next page.
  instances: [
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
    {...} // matched functional-model instance.
  ]
}
*/

```

### Delete

```
const myTrainInstance = Trains.create({ id: 'an-existing-id' })

await myModel.delete(myTrainInstance)
```

## Supported data types

The following are the supported data types (ORMType):

```
enum ORMType {
  string = 'string',
  number = 'number',
  date = 'date',
  object = 'object',
  boolean = 'boolean',
}
```

## ORM Query Searching

An out of the box method for doing orm searches is provided called an "OrmQuery". The following are some more robust examples for doing common searching.
NOTE: There are major limitations to the current implementation of "AND" and "OR" statements and the structure they are housed in. Simple AND, OR statements are provided, however, complex groupings are not supported currently.

### Search Example: Search by a value of one property AND another property.

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me all of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field"
*/
const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Numbers

```
import { ormQuery, constants } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a value of property "a" greater than 5
*/

const query = ormQuery.ormQueryBuilder()
    .property('a', 5, { type: constants.ORMType.number, equalitySymbol: constants.EQUALITY_SYMBOLS.GT })
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Limiting Results

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me up to 10 instances of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field"
*/
const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .take(10)
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Paging

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me up to 10 instances of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", starting at the given page.
*/
const pageDataFromAnotherQuery = {}

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .pagination(pageDataFromAnotherQuery)
    .take(10)
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Before a given date

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated before 2022-01-01
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesBefore('dateUpdated', new Date('2022-01-01'), { equalToAndBefore: false })
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Before a given date INCLUDING that date

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated before and including 2022-01-01
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesBefore('dateUpdated', new Date('2022-01-01'))
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: After a given date

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated after 2022-01-01
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesAfter('dateUpdated', new Date('2022-01-01'))
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Between given dates (including the dates)

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesAfter('dateUpdated', new Date('2022-01-01'))
    .datesBefore('dateUpdated', new Date('2022-02-01'))
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Sorting (Descending)

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01, and sort it by the dateUpdated property, so that the newest is first.
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesAfter('dateUpdated', new Date('2022-01-01'))
    .datesBefore('dateUpdated', new Date('2022-02-01'))
    .sort('dateUpdated', false)
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Sorting (Ascending)

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels, that has a name "the-models-name" (case insensitive), and has a textField property that starts with "something-in-the-field", that was updated between 2022-01-01 and 2022-02-01, and sort it by the dateUpdated property, so that the oldest is first.
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'the-models-name')
    .property('textField', 'something-in-the-field', { startsWith: true})
    .datesAfter('dateUpdated', new Date('2022-01-01'))
    .datesBefore('dateUpdated', new Date('2022-02-01'))
    .sort('dateUpdated')
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: Multiple values of a single property

```
import { ormQuery } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels where the name is model-1 or model-2.
*/

const query = ormQuery.ormQueryBuilder()
    .property('name', 'model-1')
    .or()
    .property('name', 'model-2')
    .compile()

const searchResults = await MyModels.search(query)
```

### Search Example: ORing multiple properties (with numbers)

```
import { ormQuery, constants } from 'functional-models-orm'

/*
Query:
Give me every instance of type MyModels where the value of property "a" is greater than 5, and the value of property "b" is less than 10, and the value of property "c" is greater-than-or-equal to 100
*/

const query = ormQuery.ormQueryBuilder()
    .property('a', 5, { type: constants.ORMType.number, equalitySymbol: constants.EQUALITY_SYMBOLS.GT })
    .or()
    .property('b', 10, { type: constants.ORMType.number, equalitySymbol: constants.EQUALITY_SYMBOLS.LT })
    .or()
    .property('c', 100, { type: constants.ORMType.number, equalitySymbol: constants.EQUALITY_SYMBOLS.GTE })
    .compile()

const searchResults = await MyModels.search(query)
```
