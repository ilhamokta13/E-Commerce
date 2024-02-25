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
            ...getAdmin(),
            ...getProductPaths(),
            ...getCartPaths(),
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
        '/user/reset-password': {
            patch: {
                summary: 'Reset user password.',
                operationId: 'resetPassword',
                description: 'Endpoint to reset user password.',
                tags: ['User'],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    oldPassword: { type: 'string' },
                                    newPassword: { type: 'string' },
                                },
                                required: ['oldPassword', 'newPassword'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Password reset successfully.',
                    },
                    401: {
                        description: 'Invalid password.',
                    },
                    500: {
                        description: 'Internal Server Error.',
                    },
                },
            },
        },
    };
}

function getAdmin() {
    return {
        '/admin/product': {
            get: {
                summary: 'Get all products.',
                operationId: 'getAdminProduct',
                description: 'Endpoint to get all products for admin.',
                tags: ['Admin'],
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
        '/admin/complete-profile': {
            patch: {
                summary: 'Complete user profile.',
                operationId: 'completeProfile',
                description: 'Endpoint to complete user profile.',
                tags: ['Admin'],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    fullName: { type: 'string' },
                                    email: { type: 'string' },
                                    telp: { type: 'string' },
                                    role: { type: 'string', enum: ['Seller', 'Customer'] },
                                    shopName: { type: 'string' },
                                },
                                required: ['fullName', 'email', 'telp', 'role', 'shopName'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Successful response with completed user profile.',
                    },
                    500: {
                        description: 'Internal Server Error.',
                    },
                },
            },
        },
    }
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
                                    latitude: { type: 'number' }, // Updated to latitude
                                    longitude: { type: 'number' }, // Updated to longitude
                                },
                                required: ['nameProduct', 'price', 'description', 'image', 'category', 'releaseDate', 'latitude', 'longitude'], // Updated to include latitude and longitude
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

        //TODO : Add product BEFORE CHANGE
        // // Product Routes
        // '/product': {
        //     post: {
        //         summary: 'Create a new product.',
        //         operationId: 'createProduct',
        //         description: 'Endpoint to create a new product.',
        //         tags: ['Product'],
        //         requestBody: {
        //             content: {
        //                 'multipart/form-data': {
        //                     schema: {
        //                         type: 'object',
        //                         properties: {
        //                             nameProduct: { type: 'string' },
        //                             price: { type: 'number' },
        //                             description: { type: 'string' },
        //                             image: { type: 'string', format: 'binary' }, // Use 'binary' for file uploads
        //                             category: { type: 'string' },
        //                             releaseDate: { type: 'string' },
        //                             location: { type: 'string' },
        //                         },
        //                         required: ['nameProduct', 'price', 'description', 'image', 'category', 'releaseDate', 'location'],
        //                     },
        //                 },
        //             },
        //         },
        //         responses: {
        //             201: {
        //                 description: 'Product added successfully.',
        //             },
        //             401: {
        //                 description: 'Seller ID not found.',
        //             },
        //             500: {
        //                 description: 'Internal Server Error.',
        //             },
        //         },
        //     },
        // },
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
                                    releaseDate: { type: 'string', format: 'date' }, // Assuming releaseDate is a date
                                    latitude: { type: 'number' }, // Updated to latitude
                                    longitude: { type: 'number' }, // Updated to longitude
                                },
                                required: ['nameProduct', 'price', 'description', 'category', 'releaseDate', 'latitude', 'longitude'], // Updated to include latitude and longitude
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

            //TODO : Update product BEFORE CHANGE
            // patch: {
            //     summary: 'Update product by ID.',
            //     operationId: 'updateProduct',
            //     description: 'Endpoint to update product details by ID.',
            //     tags: ['Product'],
            //     parameters: [
            //         {
            //             name: 'id',
            //             in: 'path',
            //             required: true,
            //             description: 'Product ID.',
            //             schema: {
            //                 type: 'string',
            //             },
            //         },
            //     ],
            //     requestBody: {
            //         required: true,
            //         content: {
            //             'multipart/form-data': {
            //                 schema: {
            //                     type: 'object',
            //                     properties: {
            //                         nameProduct: { type: 'string' },
            //                         price: { type: 'number' },
            //                         description: { type: 'string' },
            //                         image: { type: 'string', format: 'binary' }, // Define image as binary data
            //                         category: { type: 'string' },
            //                         releaseDate: { type: 'string', format: 'date' }, // Assuming releaseDate is a date
            //                         location: { type: 'string' },
            //                     },
            //                     required: ['nameProduct', 'price', 'description', 'category', 'releaseDate', 'location'],
            //                 },
            //             },
            //         },
            //     },
            //     responses: {
            //         200: {
            //             description: 'Successful response with updated product details.',
            //         },
            //         500: {
            //             description: 'Internal Server Error.',
            //         },
            //     },
            // },

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
function getCartPaths() {
    return {
        // Cart Routes
        '/cart': {
            get: {
                summary: 'Get user\'s cart.',
                operationId: 'getCart',
                description: 'Endpoint to retrieve the cart of the authenticated user.',
                tags: ['Cart'],
                responses: {
                    200: {
                        description: 'Success. Returns the user\'s cart.',
                    },
                    500: {
                        description: 'Internal server error.',
                    },
                },
            },
            post: {
                summary: 'Add product(s) to cart.',
                operationId: 'addToCart',
                description: 'Endpoint to add one or more products to the user\'s cart.',
                tags: ['Cart'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    productID: { type: 'array', items: { type: 'string' } },
                                    quantity: { type: 'array', items: { type: 'integer' } },
                                },
                                required: ['productID', 'quantity'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Success. Products added to cart.',
                    },
                    500: {
                        description: 'Internal server error.',
                    },
                },
            },
            patch: {
                summary: 'Update quantity of product(s) in cart.',
                operationId: 'updateCart',
                description: 'Endpoint to update the quantity of one or more products in the user\'s cart.',
                tags: ['Cart'],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    productID: { type: 'array', items: { type: 'string' } },
                                    quantity: { type: 'array', items: { type: 'integer' } },
                                },
                                required: ['productID', 'quantity'],
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: 'Success. Cart updated.',
                    },
                    500: {
                        description: 'Internal server error.',
                    },
                },
            },
            delete: {
                summary: 'Delete user\'s cart.',
                operationId: 'deleteCart',
                description: 'Endpoint to delete the cart of the authenticated user.',
                tags: ['Cart'],
                responses: {
                    200: {
                        description: 'Success. Cart deleted.',
                    },
                    500: {
                        description: 'Internal server error.',
                    },
                },
            },
        },

        // '/cart/decrease': {
        //     post: {
        //         summary: 'Decrease quantity of a product in cart.',
        //         operationId: 'decreaseCartItem',
        //         description: 'Endpoint to decrease the quantity of a product in the user\'s cart.',
        //         tags: ['Cart'],
        //         requestBody: {
        //             required: true,
        //             content: {
        //                 'application/json': {
        //                     schema: {
        //                         type: 'object',
        //                         properties: {
        //                             productID: { type: 'string' },
        //                         },
        //                         required: ['productID'],
        //                     },
        //                 },
        //             },
        //         },
        //         responses: {
        //             200: {
        //                 description: 'Success. Quantity decreased in cart.',
        //             },
        //             404: {
        //                 description: 'Product not found in cart.',
        //             },
        //             500: {
        //                 description: 'Internal server error.',
        //             },
        //         },
        //     },
        // },
    };
}
