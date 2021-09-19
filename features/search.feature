Feature: ORM Search Functionalities

  Scenario: The orm is searched for memory datastore models by key
    Given orm using the MemoryDatastoreProvider 
    And the orm is used to create Model1
    And the ormQueryBuilder is used to make ListModelQuery1
    When instances of the model are created with ListModelData1
    And save is called on the instances
    And search is called on the Model using the query
    Then 3 search results are found
