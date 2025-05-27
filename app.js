#!/usr/bin/node

/* deps */
const http = require('http');
const express = require('express');
const app = express();

// mongoose
const bodyParser = require('body-parser');
var mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
var urlencParser = bodyParser.urlencoded({extended:false});

// swagger io
const swaggerUi = require('swagger-ui-express');
//const swaggerJSdoc = require('swagger-jsdoc')

/* !CHATGPT-generated, beware !*/
/*
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Books API',
      version: '1.0.0',
      description: 'Simple REST API with MongoDB and Mongoose',
    },
    servers: [
      {
        url: 'http://localhost:3000', // or 8000 if that's what you're using
      },
    ],
  },
  apis: ['./app.js'], // or whatever your file is named
};
*/
//const swaggerSpec = swaggerJsdoc(swaggerOptions);
//app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const swaggerFile = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));


app.set('view engine', 'ejs');
app.use('/frontend', express.static('./frontend'));

// DB connection

var mongoDB = 'mongodb://127.0.0.1/people_db';
mongoose.connect(mongoDB, {useNewUrlParser: true,
useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console,
			'MongoDB connection error:'));

// schemas
//require('./schemas.js');

var Schema = mongoose.Schema;

var EntryModelSchema = new Schema({
	Author: String,
	Title: String

});


var EntryModel = mongoose.model('EntryModel', EntryModelSchema);




//get from DB
app.get('/', async function(req, res) {
	try{
	var Entries = await EntryModel.find();
	console.log("Got a response:" + Entries);
    	res.render('index',{Entries});
	} catch (e){
		res.status(504);
		res.render('error', {error: e, StatusCode:504 });
	}
});

app.post('/msg', urlencParser, async function(req, res) {
	console.log("Message from client side. Author: " + req.body.Author , "Title:" + req.body.Title);
	//Entries.push({'Author':req.body.Author, 'Title':req.body.Title});
	//Entries[hashCode(req.body.Author)] = {'author':req.body.Author, 'title':req.body.Title};
	// ^ This is terrible, creates n objects in the array as padding
	
 	//Add this to the schema
 	var Entry = new EntryModel({Author: req.body.Author, Title: req.body.Title
	});
 	await Entry.save();
 	
	var Entries = await EntryModel.find();

	res.render('index', {Entries});
});


app.post('/del', urlencParser, async function(req, res){
	console.log("del author with id " + req.body.id);
	

	const q = EntryModel.findByIdAndDelete(req.body.id);
	try{
	await q.then(() =>
		console.log("Success! " + q)
	);
	} catch (e){
		console.log("An error occured:", e);
	}

	var books = await EntryModel.find();
	Entries = books;
	//key = Entries.findIndex(zn=> zn.Title === req.body.Title);
	
	/*if(key != -1) {
		Entries.splice(key, 1);
		console.log("Deleted" + req.body.Author);
		res.render('index', {Entries});
	} else throw "UHHHHHHHH";
	console.log(Entries); */
	res.status(200);
	res.render('index', {Entries});
});


app.post('/patch', urlencParser, async function(req, res){
	//console.log(req);
	console.log("Update author with id " + req.body.id + "");
	// try to retrieve the updated author and title
	
	console.log("New Author:", req.body.Author, req.body.Title);
	if ( req.body.Author && req.body.Title){
		try {
			
		console.log("Entered loop");
		const doc = await EntryModel.findByIdAndUpdate(
			req.body.id,
			{$set: 
			{Author: req.body.Author,
			Title: req.body.Title}},
			{new: true}
		);
			
		} catch (err) {
			res.status(500);
			console.log("An error occured:", err);
		}
	}

	var books = await EntryModel.find();
	Entries = books;
	res.status(200);
	res.render('index', {books});
});

/* REST API */

app.get('/api/books', async function(req, res) {
	// #swagger.summary = 'Get all books.'
	try{
	var Entry = await EntryModel.find();
	res.status(200).send(Entry);
	} catch (err) {
		console.log("An error occured:");
	}
});


app.get('/api/books/:id', async function(req, res) {
	// #swagger.summary = 'Find a book with a specified ID.'
	try{
	const Entry = await EntryModel.findbyId(req.params.id);
	if (!Entry) {
		console.log("No entry with id" + req.params.id);
		return res.status(404).send({message: "Entry not found"});
	}else {
		res.status(200).json(Entry);
	}
	} catch (err) {
		console.log("[Error] GET /api/books/:id" + err);
		res.status(500).send({error: "Internal Server Error"});
	}
});


app.post('/api/books/:id', async function(req,res){
	// #swagger.summary = 'Create a book. Returns the Entry and the ID of the object.'
	try{
	const Entry = new EntryModel({
		Author: req.body.Author,
		Title: req.body.Title
	});
	await entry.save();
	res.status(201).json(Entry)
	} catch (err){
		console.log("[Error] POST /api/books/:id" + err);
		res.status(400).send({error: "Bad request"});
	} 
});


app.put('/api/books/:id', async function(req, res) {
	// #swagger.summary = 'Update a book with a specified ID.'
		try {
		const doc = await EntryModel.findByIdAndUpdate(
			req.params.id,
			{$set: 
			{Author: req.body.Author,
			Title: req.body.Title}},
			{new: true}
		);
		if (!doc) return res.status(404).send({message: "Entry not found"});
		else res.status(200).json(doc);
		} catch (err) {
			res.status(500);
			console.log("An error occured:", err);
		}
});


app.delete('/api/books/:id', async function(req, res) {
	// #swagger.summary = 'Delete a book with an ID.'
	try{
	const Entry = await EntryModel.findByIdAndDelete(req.params.id);
	if (!Entry) {
		console.log("[Error] Can't delete; No entry with id" + req.params.id);
		return res.status(404).send({message: "Entry not found"});
	} else {
		return res.status(200).json({message: "Book Deleted"});
	}
	} catch (err){
		console.log("[Error] DELETE /api/books/:id" + err);
		res.status(500).send({error: "Internal Server Error"});
	}
});

		

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0, len = str.length; i < len; i++) {
        let chr = str.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}


const server = http.createServer(app);
const port = 8000;
server.listen(port);
console.debug('Server listening on port ' + port); 
