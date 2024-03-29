import dotenv from 'dotenv';
import express, { json } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import verify from './v1/middleware/tokenVerification.js';
import { logger, appLogger } from './v1/middleware/logger.js';
import { createRedisClient } from './redisClient.js';
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
const { HOST, ENVIR, PORT, USERNAME, PASSWORD, REDISPORT, PRIKEY, CRT, PEMFILE, MONGODB_URI } = process.env;
const url = ENVIR !== 'test' ? MONGODB_URI : process.env.MONGODB_URI;

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

// Connect to MongoDB database using Mongoose
const connectToMongoDB = async () => {
 try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    logger.info('MongoDB connected!');
 } catch (error) {
    logger.error('MongoDB connection error:', error);
   logger.error("Not connecting to DB. check is your mongoDB is running");
 }
};

connectToMongoDB();

// Create Redis client
const redisClient = await createRedisClient(ENVIR);

// The rest of your application setup remains the same
app.use(cors());
app.use(urlencoded({ extended: false }));
app.use(express.json());

// Agent library
app.use(useragent.express());

// Use loggers
app.use(appLogger);

// Use Swagger UI
app.use(APP_PATH + '/swagger', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

// Use routes
app.use(APP_PATH + '/auth', verify, authRoutes);
app.use(APP_PATH + '/admin', adminRoutes);
app.use(APP_PATH, generalRoutes);

app.listen(PORT, () => {
 logger.info(`Server is now running on port ${PORT}`);
});

export default app;
