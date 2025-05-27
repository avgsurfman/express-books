const swaggerAutogen = require('swagger-autogen')({openapi: '3.0.0'});

const doc = {
definitions: {
  openapi: '3.0.0',
  info: {
    version: '0.0.1',
    title: 'My Little API',
    description: 'RESTful is magic'
  },
  servers: [
    {
      url: '',              // by default: 'http://localhost:3000'
      description: 'gentoo computer'       // by default: ''
    },
  ],
    components: {
      schemas: {
        Book: {
          type: 'object',
          required: ['Author', 'Title'],
          properties: {
            _id: { type: 'string', description: 'MongoDB document ID' },
            Author: { type: 'string', description: 'Author of the book' },
            Title: { type: 'string', description: 'Book title' }
          }
        }
      }
    }
}
};


const outputFile = './swagger-output.json';
const routes = ['./app.js'];

/* NOTE: If you are using the express Router, you must pass in the 'routes' only the 
root file where the route starts, such as index.js, app.js, routes.js, etc ... */

swaggerAutogen(outputFile, routes, doc);
