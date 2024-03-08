
// Import dependencies
import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb'; // Import MongoClient from 'mongodb'
import bodyParser from 'body-parser';
import verify from './v1/middleware/tokenVerification.js';
import { logger, appLogger } from './v1/middleware/logger.js';
import { createClient } from 'redis';
import { readFileSync } from 'fs';
import useragent from 'express-useragent';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

dotenv.config();

// Import routes
import generalRoutes from './v1/routes/general.routes.js';
import authRoutes from './v1/routes/auth.routes.js';
import adminRoutes from './v1/admin/route/admin.routes.js';

const { urlencoded } = bodyParser;

// Start app
const app = express();

// Get environment variables
const { HOST, ENVIR, PORT, USERNAME, PASSWORD, REDISPORT, PRIKEY, CRT, PEMFILE } = process.env;
const url = ENVIR !== 'test' ? process.env.DB : process.env.TESTDB;

// URL path
const APP_PATH = '/api/v1';

// Swagger JSDoc configuration
const swaggerOptions = {
 definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ovidot Backend API',
      version: '1.0.0',
      description: 'Ovidot Backend API Documentation',
    },
    components: {
      securitySchemes: {
        adminToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        userToken: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    servers: [
      {
        url: `http://${HOST}:${PORT}${APP_PATH}/admin`,
        description: 'Admin Routes Server',
      },
      {
        url: `http://${HOST}:${PORT}${APP_PATH}/auth`,
        description: 'Authenticated Routes server',
      },
      {
        url: `http://${HOST}:${PORT}${APP_PATH}`,
        description: 'General Routes server',
      },
    ],
 },
 apis: ['./v1/routes/*.js', "./v1/routes/auth/*.js", "./v1/admin/route/*.js"]
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Connect to MongoDB database using MongoClient
const client = new MongoClient(process.env.MONGODB_URI, {
 useNewUrlParser: true,
 useUnifiedTopology: true,
});

client.connect()
 .then(() => {
    logger.info('MongoDB connected!');
    // You can now use the client to interact with your database
    // For example, to get a reference to a database:
    // const db = client.db('yourDatabaseName');
 })
 .catch(error => {
    logger.error('MongoDB connection error:', error);
 });

// The rest of your application setup and route definitions go here...

app.listen(PORT, () => {
 logger.info(`Server is now running on port ${PORT}`);
});

export default app;
