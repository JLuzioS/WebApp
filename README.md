ElasticSearch:
* Indices : 
1. users
2. groups
3. games


Environment Variables:
1. ATLAS_CLIENT_ID - Client id used on Atlas API e.g.: IxaAL12312
2. ELASTICSEARCH_URL - URL used for elasticsearch access e.g.: http://localhost:9200/

ElasticSearch Documents examples:
1. user:   {
        "_index" : "users",
        "_type" : "_doc",
        "_id" : "hqWkIX4B3nVCmnc-HaTL",
        "_score" : 1.0,
        "_source" : {
          "token" : "17142731-159f-40ff-b223-bc4739d74aa4",
          "name" : "Jorge"
        }
      }

2. group: {
        "_index" : "groups",
        "_type" : "_doc",
        "_id" : "h6WkIX4B3nVCmnc-kqQE",
        "_score" : 1.0,
        "_source" : {
          "owner" : "17142731-159f-40ff-b223-bc4739d74aa4",
          "name" : "Assignment1Appasd1232",
          "description" : "qweqwe"
        }
      }

3. game: {
        "_index" : "games",
        "_type" : "_doc",
        "_id" : "M8axIX4Bf5az5e-nAeu1",
        "_score" : 1,
        "_source" : {
            "groupId" : "MsavIX4Bf5az5e-nievc",
            "id" : "OIXt3DmJU0",
            "name" : "Catan"
        }
    }

Um game pertence a um grupo (groupId), um grupo pertence a um user (owner).

Um user pode ter N grupos e um Grupo pode ter N games.