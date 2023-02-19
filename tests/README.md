# Unit Test

## How to run unit test locally

1. Using Docker to start a MongoDB container locally with 27017 port and `test` database.

```
docker run --name mongoose-soft-delete-test -e MONGO_INITDB_DATABASE=test -d -p 27017:27017 mongo:6.0.3
```

2. Run jest!

_Notice: please make sure you don't use wrong database to perform unit test_

```
npm run test
```

3. After tested it locally, you can teardown with

```
docker rm -f mongoose-soft-delete-test
```
