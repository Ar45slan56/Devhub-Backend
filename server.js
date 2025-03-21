require('dotenv').config();
const express = require('express');
const session = require('express-session');
const colors = require('colors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');
const http = require('http');

const connectDB = require('./config/Database');
const passport = require('./config/Passport');
const { WebSocketService } = require('./service');

// Routes imports
const Router = require('./routes/index');
const SwagerTestRoute = require('./routes/SwagerTestRoute');

const app = express();

// Only connect to database if not in test environment
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
const io = WebSocketService.initialize(server);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'devhub_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Create a log directory if it doesn't exist
  const logDirectory = path.join(__dirname, 'logs');
  fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

  // Create a write stream for access logs
  const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' }
  );

  app.use(morgan('combined', { stream: accessLogStream }));
}

// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'DevHub API',
      version: '1.0.0',
      description: 'DevHub API Documentation',
      contact: {
        name: 'DevHub Team'
      },
      servers: [
        {
          url: process.env.BASE_URL || 'http://localhost:5000'
        }
      ]
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./routes/*.js', './controllers/*.js', './models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api', Router);
app.use('/api/swagger-test', SwagerTestRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Server Error'
      : err.message
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Export the app and server before the listen call
module.exports = { app, server };

// Only start the server if this file is run directly and not in test mode
if (require.main === module && process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`.blue.bold);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  server.close(() => process.exit(1));
});
