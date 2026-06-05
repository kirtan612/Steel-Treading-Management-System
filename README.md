# Steel Pipe Trading ERP System

## Project Overview

Steel Pipe Trading ERP System is a web-based business management application designed for steel pipe trading companies. The system helps manage inventory, customers, orders, invoices, and business reports through a centralized platform.

The goal of this project is to simplify daily business operations, improve inventory tracking, streamline order processing, and provide useful business insights through reports and dashboards.

This project is being developed as a MERN Stack application using React.js, Node.js, Express.js, and MongoDB.

---

## Objectives

* Manage steel pipe inventory efficiently
* Maintain customer records in a centralized database
* Create and manage customer orders
* Generate invoices for completed orders
* Monitor business performance through reports and dashboards
* Provide a scalable foundation for future business requirements

---

## Features

### Authentication

* Secure user login
* Protected application routes
* Session management

### Dashboard

* Business overview
* Revenue summary
* Order statistics
* Customer statistics
* Inventory summary
* Low stock notifications

### Inventory Management

* Add inventory items
* Update inventory details
* Remove inventory items
* Search and filter inventory
* Monitor stock levels

### Customer Management

* Add customer information
* Edit customer details
* View customer records
* Manage customer history

### Order Management

* Create new orders
* Track order status
* View order history
* Manage order information

### Invoice Management

* Generate invoices
* View invoice records
* Download invoice PDFs

### Reports

* Revenue reports
* Sales reports
* Inventory reports
* Business performance summaries

---

## System Modules

### 1. Authentication Module

Responsible for user access and security.

### 2. Dashboard Module

Provides a high-level overview of business activities.

### 3. Inventory Module

Handles stock management and inventory tracking.

### 4. Customer Module

Stores and manages customer information.

### 5. Order Module

Manages order creation and tracking.

### 6. Invoice Module

Generates and stores invoice records.

### 7. Reports Module

Provides analytical insights and summaries.

---

## High-Level Architecture

```text
Users
   │
   ▼
React Frontend
   │
   ▼
Express REST APIs
   │
   ▼
MongoDB Database
```

---

## Technology Stack

### Frontend

* React.js
* Tailwind CSS
* React Router DOM
* Axios

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT (JSON Web Token)
* bcrypt

---

## Database Collections

### Users

Stores application user information.

### Inventory

Stores steel pipe inventory records.

### Customers

Stores customer information.

### Orders

Stores order details and status.

### Invoices

Stores generated invoice records.

---

## Application Structure

### Main Pages

1. Login
2. Dashboard
3. Inventory
4. Add/Edit Inventory
5. Customers
6. Orders
7. Invoices
8. Reports

---

## Workflow

1. User logs into the system.
2. User accesses the dashboard.
3. Inventory is added and maintained.
4. Customer records are created.
5. Orders are generated for customers.
6. Invoices are generated from orders.
7. Reports provide business insights.

---

## Future Enhancements

* Role-based access control
* Supplier management
* Multi-warehouse support
* Advanced analytics
* Email invoice delivery
* Barcode integration
* Export reports to Excel
* Mobile application support

---

## Project Status

Current Phase:
System Design and UI Planning

Upcoming Phases:

1. UI Development
2. Backend Development
3. API Integration
4. Testing
5. Deployment




---

## API Documentation

The backend API is fully documented using Swagger UI. After starting the backend server, you can access the interactive API documentation at:

**URL:** `http://localhost:5000/api/docs`

### Features:
- Complete API endpoint documentation
- Request/response schemas
- Interactive testing interface
- JWT authentication support

### How to Test APIs in Swagger UI:

1. Start the backend server: `npm run dev` (in the `backend` folder)
2. Open `http://localhost:5000/api/docs` in your browser
3. Find **POST /api/v1/auth/login** under the Auth section
4. Click "Try it out" and enter credentials:
   ```json
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
   ```
5. Click "Execute" and copy the `accessToken` from the response
6. Click the 🔓 **Authorize** button at the top right
7. Paste the token (without "Bearer" prefix) and click "Authorize"
8. Now you can test any protected endpoint directly from Swagger UI

### API Modules:
- **Auth** - Authentication and authorization
- **Inventory** - Steel pipe inventory management
- **Customers** - Customer management
- **Orders** - Order management
- **Invoices** - Invoice management
- **Reports** - Business reports and analytics
