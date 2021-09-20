Feature: Basic orm functionality

  Scenario: An orm model is created using a memoryDatastoreProvider
    Given orm using the MemoryDatastoreProvider 
    And the orm is used to create Model1 
    When an instance of the model is created with ModelData1
    And save is called on the model
    And the datastore's retrieve is called with values
      | id        | test-id | 
    Then the result matches ModelData1 

  Scenario: An orm model is created then deleted and no longer exists.
    Given orm using the MemoryDatastoreProvider 
    And the orm is used to create Model1 
    When an instance of the model is created with ModelData1
    And save is called on the model
    And delete is called on the model
    And the datastore's retrieve is called with values
      | id        | test-id | 
    Then the result matches undefined 

