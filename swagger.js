const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Commerce API',
            version: '1.0.0',
            description: 'My REST API',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
        paths: {
            // Register
            '/user/register': {
                post: {
                    summary: 'Register a new user.',
                    tags: ['User'],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        fullName: { type: 'string' },
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                        telp: { type: 'string' },
                                        role: { type: 'string', enum: ['Seller', 'Customer'] },
                                    },
                                    required: ['fullName', 'email', 'password', 'telp', 'role'],
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'User registered successfully.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
            // Login
            '/user/login': {
                post: {
                    summary: 'User login.',
                    tags: ['User'],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        email: { type: 'string' },
                                        password: { type: 'string' },
                                    },
                                    required: ['email', 'password'],
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'User logged in successfully.',
                        },
                        401: {
                            description: 'Invalid email or password.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
        },
    },
    apis: [path.resolve(__dirname, 'routes', '*.js')], // Assuming your route files are in the routes directory
};

const specs = swaggerJsdoc(options);

module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(specs),
};
