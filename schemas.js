const mongoose = require('mongoose');


const Schema = mongoose.Schema;

const EntryModelSchema = new Schema({
	Author: String,
	Title: String

}
);


const  EntryModel = mongoose.model('EntryModel', EntryModelSchema);

export EntryModel;


