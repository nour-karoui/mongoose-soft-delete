<h1 align="center">Welcome to soft-delete-plugin-mongoose 👋</h1>
<p>
  <a href="https://www.npmjs.com/package/soft-delete-plugin-mongoose" target="_blank">
    <img alt="Version" src="https://img.shields.io/npm/v/soft-delete-plugin-mongoose.svg">
  </a>
  <a href="https://github.com/nour-karoui/mongoose-soft-delete#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/nour-karoui/mongoose-soft-delete/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/nour-karoui/mongoose-soft-delete/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/bishkou/password-pwnd" />
  </a>
</p>

> a mongoose plugin that allows you to soft delete documents and restore them in MongoDB (for JS & TS)

* **Soft delete your MongoDB documents and restore them**

* **JS and TS**


### 🏠 [Homepage](https://github.com/nour-karoui/mongoose-soft-delete)


## Install

```sh
npm install soft-delete-plugin-mongoose
```

## How It Works

**Javascript Version**
```js
const mongoose = require('mongoose');
const { softDeletePlugin } = require('soft-delete-plugin-mongoose');
const Schema = mongoose.Schema;

const TestSchema = new Schema({
    name: String,
    lastName: String
});

TestSchema.plugin(softDeletePlugin);
const Test =  mongoose.model("Test", TestSchema);

const test = new Test({name: 'hello', lastName: "world"});

/*** returns an object containing the number of softDeleted elements ***/
/***
    {deleted: number} 
***/
/***
    the argument options is optional
***/
const options = { validateBeforeSave: false };
const deleted = await Test.softDelete({ _id: test._id, name: test.name }, options);
/** 
 const deleted = await Test.softDelete({ _id: test._id, name: test.name }); is also valid
**/

/*** returns an object containing the number of restored elements ***/
/***
    {restored: number} 
***/
const restored = await Test.restore({ _id: test._id, name: test.name });

/*** returns all deleted elements ***/
const deletedElements = await Test.findDeleted();

/*** returns all available elements (not deleted) ***/
const availableElements = await Test.find();

/*** counts all available elements (not deleted) ***/
const countAvailable = await Test.count();

/*** findById returns the document whether deleted or not  ***/
```

**Typescript Version**
```ts
import * as mongoose from 'mongoose';
import { softDeletePlugin, SoftDeleteModel } from 'soft-delete-plugin-mongoose';

interface Test extends mongoose.Document {
    name: string;
    lastName: string;
}

const TestSchema = new mongoose.Schema({
    name: String,
    lastName: String
});
TestSchema.plugin(softDeletePlugin);
// two different ways of implementing model depending on technology used
// 1st way
const testModel = mongoose.model<Test, SoftDeleteModel<Test>>('Test', TestSchema);

//2nd way (nestjs way)
constructor(@InjectModel('Test') private readonly testModel: SoftDeleteModel<Test>) {}

const test = await new this.testModel({name: 'hello', lastName: 'world'});

/*** returns an object containing the number of softDeleted elements ***/
/***
    {deleted: number} 
***/
/***
    the argument options is optional
***/
const options = { validateBeforeSave: false };
const deleted = await Test.softDelete({ _id: test._id, name: test.name }, options);
/** 
 const deleted = await Test.softDelete({ _id: test._id, name: test.name }); is also valid
**/

/*** returns an object containing the number of restored elements ***/
/***
    {restored: number} 
***/
const restored = await this.testModel.restore({ _id: test._id, name: test.name });

/*** returns all deleted elements ***/
const deletedElements = await this.testModel.findDeleted();

/*** returns all available elements (not deleted) ***/
const availableElements = await this.testModel.find();

/*** counts all available elements (not deleted) ***/
const countAvailable = await Test.count();

/*** findById returns the document whether deleted or not  ***/
```

## Author

👤 **Nour**

* Github: [@nour-karoui](https://github.com/nour-karoui)
* LinkedIn: [@nourkaroui](https://www.linkedin.com/in/nourkaroui/)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/nour-karoui/mongoose-soft-delete/issues). You can also take a look at the [contributing guide](https://github.com/nour-karoui/mongoose-soft-delete/blob/master/CONTRIBUTING.md).

## Show your support

Give a [STAR](https://github.com/nour-karoui/mongoose-soft-delete) if this project helped you!

## 📝 License

* Copyright © 2021 [Nour](https://github.com/nour-karoui).
* This project is [MIT](https://github.com/nour-karoui/mongoose-soft-delete/blob/master/LICENSE) licensed.

***
_This README was generated with by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
