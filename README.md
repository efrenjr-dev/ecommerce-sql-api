The Ecommerce API provides many API tools, and resources that enable user management, product management, shopping session, and order retrieval.

Complete API routes documentation is available at https://documenter.getpostman.com/view/17327200/2sAYBPmaHv

## Features

### Auth

- User registration
    
- User authentication (jsonwebtoken with Refresh Token rotation)
    
- Password reset via email link
    
- Verify email via email link
    

### User

- Get authenticated user information
    
- User management (admin)
    
    - Create user
        
    - Get users with filter and pagination
        
    - Update user
        

### Product

- Inventory management
    
- Product management
    
    - Create product
        
    - Get products with filter and pagination
        
    - Update product
        

### Shopping

- Cart management
    
    - Add/remove item to/from cart
        
    - Update cart item
        
    - Get cart
        
- Get user orders
    

## **Getting started guide**

Run development script

``` bash
npm run dev

 ```

API URL is accessible through port 3000 at **localhost:3000/v1/** by default

The API returns request responses in serialized JSON format via [SuperJSON](https://github.com/flightcontrolhq/superjson). When an API request returns an error, it is sent in the JSON response as an error message.

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

The limit is 300 requests per minute. If you exceed either limit, your request will return an HTTP 429 Too Many Requests status code.

