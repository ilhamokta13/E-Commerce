// Importing required modules
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// Swagger options for API documentation
const swaggerOptions = {
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
        security: [{
            BearerAuth: [],
        }],
        components: {
            securitySchemes: {
                BearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        paths: {
            ...getUserPaths(),
            ...getProductPaths(),
            // ... (add other paths as needed)
        },
    },
    apis: [path.resolve(__dirname, 'routes', '*.js')],
};

// Generate Swagger specifications
const specs = swaggerJsdoc(swaggerOptions);

// Exporting Swagger UI configuration
module.exports = {
    serve: swaggerUi.serve,
    setup: swaggerUi.setup(specs),
};

// User-related paths
function getUserPaths() {
    return {
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
        '/admin/product': {
            get: {
                summary: 'Get all products.',
                operationId: 'getAdminProduct',
                description: 'Endpoint to get all products for admin.',
                tags: ['User'],
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
    };
}

// Product-related paths
function getProductPaths() {
    return {
        // Product Routes
        '/product': {
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
        '/product': {
            post: {
                summary: 'Create a new product.',
                operationId: 'createProduct',
                description: 'Endpoint to create a new product.',
                tags: ['Product'],
                requestBody: {
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nameProduct: { type: 'string' },
                                    price: { type: 'number' },
                                    description: { type: 'string' },
                                    image: { type: 'string', format: 'binary' }, // Use 'binary' for file uploads
                                    category: { type: 'string' },
                                    releaseDate: { type: 'string' },
                                    location: { type: 'string' },
                                },
                                required: ['nameProduct', 'price', 'description', 'image', 'category', 'sellerID', 'releaseDate', 'location'],
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
        '/product/{id}': {
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
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                properties: {
                                    nameProduct: { type: 'string' },
                                    price: { type: 'number' },
                                    description: { type: 'string' },
                                    image: { type: 'string', format: 'binary' }, // Define image as binary data
                                    category: { type: 'string' },
                                    sellerID: { type: 'string' },
                                    releaseDate: { type: 'string', format: 'date' }, // Assuming releaseDate is a date
                                    location: { type: 'string' },
                                },
                                required: ['nameProduct', 'price', 'description', 'category', 'sellerID', 'releaseDate', 'location'],
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
    };
}
