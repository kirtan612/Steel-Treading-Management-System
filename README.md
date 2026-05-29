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


