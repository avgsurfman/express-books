#!/usr/bin/node

/* deps */
const http = require('http');
const cors = require('cors');
const express = require('express');
const app = express();


// so that swagger doesn't fuck up
app.use(cors());
app.use(express.json());


// mongoose
const bodyParser = require('body-parser');
var mongoose = require('mongoose');
const { ObjectId } = require('mongoose').Types;
var urlencParser = bodyParser.urlencoded({extended:true});
app.use(bodyParser.json());


// swagger io
const swaggerUi = require('swagger-ui-express');
//const swaggerJSdoc = require('swagger-jsdoc')

const swaggerFile = require('./swagger-output.json');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));

// graphql
var { graphql, buildSchema } = require("graphql");
const { createHandler } = require('graphql-http/lib/use/express');
// grapqhqli
const { ruruHTML} = require('ruru/server');


// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Book {
    id: String
    Author: String
    Title: String
  }

  type Query {
  	books: [Book]
	book(id: ID!): Book
  }

  input EntryInput {
  	Author: String!
	Title: String!
  }

  type Mutation {
  	createEntry(input: EntryInput!): Book
  }
`);
// updateEntry(id: String!, input: EntryInput!) : Book

app.set('view engine', 'ejs');
app.use('/frontend', express.static('./frontend'));

// DB connection

var mongoDB = 'mongodb://127.0.0.1/people_db';
mongoose.connect(mongoDB, {useNewUrlParser: true,
useUnifiedTopology: true});
var db = mongoose.connection;
db.on('error', console.error.bind(console,
			'MongoDB connection error:'));
db.once('open', () => {
	console.log( '+++Connected to mongoose');
})

// schemas
//require('./schemas.js');

var Schema = mongoose.Schema;

var EntryModelSchema = new Schema({
	Author: String,
	Title: String

});


var EntryModel = mongoose.model('EntryModel', EntryModelSchema);

// Root resolver
const root = {
  books: async () => await EntryModel.find(),
  book: async ({ id }) => await EntryModel.findById(id),
  createEntry: async ({input}) => {
	const newEntry = new EntryModel(input);
	return await newEntry.save();
  } 

};


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
	res.status(200);
	res.render('index', {Entries});
});


app.post('/patch', urlencParser, async function(req, res){
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
	const Entry = await EntryModel.findById(req.params.id);
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


app.post('/api/books', async function(req,res){
	// #swagger.summary = 'Create a book. Returns the Entry and the ID of the object.'
	console.log("Incoming POST body:", req.params);
	try{
	const Entry = new EntryModel({
		Author: req.params.Author,
		Title: req.params.Title
	});
	await Entry.save();
	res.status(201).json(Entry)
	} catch (err){
		console.log("[Error] POST /api/books/ " + err);
		res.status(400).send({error: "Bad request"});
	}
})

// undefined hell -> DO NOT USE req.body without sanitization and null-checks!
app.put('/api/books/:id', async function(req, res) {
	// #swagger.summary = 'Update a book with a specified ID.'
	console.log(req.params);
	console.log(req.body);
	try {
		Entry = await updatebyID(req.params.id, req.body.Author, req.body.Title);
		if (!Entry) return res.status(404).send({message: "Entry not found"});
		else res.status(200).json(Entry);
		} catch (err) {
			console.log("[Error] PUT /api/books/:id " + err);
			res.status(500).send({error: "Internal Server Error"});
		}
});


app.delete('/api/books/:id', async function(req, res) {
	// #swagger.summary = 'Delete a book with an ID.'
	try{
	Entry = await deletebyID(req.params.id);
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


/* CRUD FUNCTIONS */

async function deletebyID(id){
	const Entry = await EntryModel.findByIdAndDelete(id)
	return Entry;
}

async function updatebyID(id, author, title){
		const Entry = await EntryModel.findByIdAndUpdate(
			id,
			{$set: 
			{Author: author, 
			Title: title}},
			{new: true}
		);
	return Entry;
}


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


app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerFile);
});


// Create and use the GraphQL handler.
app.all(
  '/graphql',
  createHandler({
    schema: schema,
    rootValue: root,
  }),
);

app.get('/graphqli', (_req, res) => {
  res.type('html');
  res.end(ruruHTML({ endpoint: '/graphql' }));
});


// Start the server at port
app.listen(4000);
console.log('Running a GraphQL API server at http://localhost:4000/graphql');

const server = http.createServer(app);
const port = 8000;
server.listen(port);
console.debug('Server listening on port ' + port); 
