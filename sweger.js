

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
                description: 'Development server',
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
            // Product Routes
            '/product/create': {
                post: {
                    summary: 'Create a new product.',
                    operationId: 'createProduct',
                    description: 'Endpoint to create a new product.',
                    tags: ['Product'],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nameProduct: { type: 'string' },
                                        price: { type: 'number' },
                                        description: { type: 'string' },
                                        image: { type: 'string' },
                                        category: { type: 'string' },
                                        sellerID: { type: 'string' },
                                        releaseDate: { type: 'string' },
                                        location: { type: 'string' },
                                        stock: { type: 'number' },
                                    },
                                    required: ['nameProduct', 'price', 'description', 'image', 'category', 'sellerID', 'releaseDate', 'location', 'stock'],
                                },
                            },
                        },
                    },
                    responses: {
                        201: {
                            description: 'Product added successfully.',
                        },
                        401: {
                            description: 'Seller ID not found.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
            // Product Routes
            '/product/all': {
                get: {
                    summary: 'Get all products.',
                    operationId: 'getAllProducts',
                    description: 'Endpoint to get all products.',
                    tags: ['Product'],
                    responses: {
                        200: {
                            description: 'Successful response with all products.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
            // Product Routes
            '/product/detail/{id}': {
                get: {
                    summary: 'Get product by ID.',
                    operationId: 'getProductById',
                    description: 'Endpoint to get product details by ID.',
                    tags: ['Product'],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Product ID.',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Successful response with product details.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
            // Product Routes
            '/product/update/{id}': {
                patch: {
                    summary: 'Update product by ID.',
                    operationId: 'updateProduct',
                    description: 'Endpoint to update product details by ID.',
                    tags: ['Product'],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Product ID.',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        nameProduct: { type: 'string' },
                                        price: { type: 'number' },
                                        description: { type: 'string' },
                                        image: { type: 'string' },
                                        category: { type: 'string' },
                                        sellerID: { type: 'string' },
                                        releaseDate: { type: 'string' },
                                        location: { type: 'string' },
                                        stock: { type: 'number' }, 
                                    },
                                    required: ['nameProduct', 'price', 'description', 'image', 'category', 'sellerID', 'releaseDate', 'location', 'stock'],
                                },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: 'Successful response with updated product details.',
                        },
                        500: {
                            description: 'Internal Server Error.',
                        },
                    },
                },
            },
            // Product Routes
            '/product/delete/{id}': {
                delete: {
                    summary: 'Delete product by ID.',
                    operationId: 'deleteProduct',
                    description: 'Endpoint to delete product by ID.',
                    tags: ['Product'],
                    parameters: [
                        {
                            name: 'id',
                            in: 'path',
                            required: true,
                            description: 'Product ID.',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    responses: {
                        200: {
                            description: 'Successful response with deleted product details.',
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
