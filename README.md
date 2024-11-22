# E-Commerce SQL API

This repository contains the backend code for an E-commerce application https://github.com/efrenjr-dev/ecommerce-react. The API is built using modern web technologies to manage product data, user accounts, and inventory, while integrating third-party services for efficient and scalable features such as image storage and data management.

Complete API routes documentation is available at https://documenter.getpostman.com/view/17327200/2sAYBPmaHv

## Technologies Used

### Backend Frameworks and Libraries

- **Node.js**
- **Express.js**
- **Prisma ORM**

### Database

- **PostgreSQL via Supabase**

### Cloud Storage

- **Amazon S3**: Used for storing and serving product images.

### Authentication and Security

- **JSON Web Tokens (JWT)**: Provides user session management with refresh token rotation.

### Validation

- **Joi**: Schema-based validation library for ensuring request payloads meet API expectations.

### Image Uploads

- **Multer**: Middleware for handling multipart/form-data for file uploads.
- **Sharp**: Image processing library for resizing and optimizing uploaded images before storage.


## Features

### Auth

- **User Registration**: Allows users to create accounts securely.
- **User Authentication**: Secure login using JSON Web Tokens (JWT) with refresh token rotation.
- **Password Reset**: Provides users the ability to reset their password via an email link.
- **Email Verification**: Ensures account authenticity via verification links sent to users' email addresses.

### User

- **Get Authenticated User Info**: Retrieve details of the currently logged-in user.
- **User Management** (Admin only):
  - Create new users.
  - Fetch users with advanced filtering and pagination.
  - Update user details.

### Product

- **Inventory Management**: Track and update stock quantities for each product.
- **Product Management**:
  - Create new products with support for multiple images.
  - Retrieve products with search, filtering, and pagination options.
  - Update product details including images.

### Shopping

- **Cart Management**:
  - Add or remove items to/from the cart.
  - Update quantities of items in the cart.
  - View the current state of the cart.
- **Order Management**:
  - Retrieve a user's order history and order details.

### Additional Features

- **Search and Filtering**
- **Image Uploads**: Handles product image uploads with Amazon S3 for scalable storage.


## **Getting started guide**

Run development script

``` bash
npm run dev

 ```
## API Information

### Base URL

The API is accessible through port 3000 at **`http://localhost:3000/v1/`** by default.

### Response Format

The API returns serialized JSON responses via [SuperJSON](https://github.com/flightcontrolhq/superjson). 

### Authentication Token

Authenticated user should include Access Token thru HTTP authorization header as Bearer token. This may be taken after registration of a new user account or logging in as an admin account -

``` json
{ 
"email": "admin@example.com",
"password": "admin123"
}

 ```

### Authentication error response

If a token is missing, malformed, or invalid, you will receive an HTTP 401 Unauthorized response code.

## Rate and usage limits

The limit is 300 requests per minute by default and can be set through updating environment variables. If you exceed the limit, your request will return an HTTP 429 Too Many Requests status code.

