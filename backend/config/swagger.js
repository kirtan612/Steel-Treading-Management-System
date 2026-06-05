const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SteelTrack ERP API',
      version: '1.0.0',
      description: 'Complete API documentation for SteelTrack Steel Pipe Trading ERP System',
      contact: {
        name: 'SteelTrack Dev Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        InventoryItem: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Unique identifier' },
            itemCode: { type: 'string', description: 'Auto-generated item code' },
            name: { type: 'string', description: 'Item name' },
            pipeType: { 
              type: 'string', 
              enum: ['ERW', 'Seamless', 'GI Pipe', 'Hollow Section', 'MS Pipe'],
              description: 'Type of steel pipe'
            },
            grade: { type: 'string', description: 'Steel grade (e.g., IS 1239)' },
            outerDiameter: { type: 'number', description: 'Outer diameter in mm' },
            wallThickness: { type: 'number', description: 'Wall thickness in mm' },
            unit: { type: 'string', enum: ['kg', 'mt', 'pcs'], description: 'Unit of measurement' },
            stockQty: { type: 'number', description: 'Current stock quantity' },
            reorderLevel: { type: 'number', description: 'Minimum stock level before reorder' },
            purchasePrice: { type: 'number', description: 'Purchase price per unit' },
            sellingPrice: { type: 'number', description: 'Selling price per unit' },
            hsnCode: { type: 'string', description: 'HSN code for GST' },
            location: { type: 'string', description: 'Storage location' },
            description: { type: 'string', description: 'Additional description' },
            status: { type: 'string', enum: ['In Stock', 'Low Stock', 'Out of Stock'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            _id: { type: 'string', description: 'Unique identifier' },
            customerCode: { type: 'string', description: 'Auto-generated customer code' },
            name: { type: 'string', description: 'Customer name' },
            company: { type: 'string', description: 'Company name' },
            phone: { type: 'string', description: 'Phone number' },
            email: { type: 'string', format: 'email' },
            billingAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                pincode: { type: 'string' }
              }
            },
            gstNumber: { type: 'string', description: 'GST number' },
            customerType: { 
              type: 'string', 
              enum: ['Retail', 'Wholesale', 'Contractor', 'Industrial']
            },
            creditLimit: { type: 'number', description: 'Credit limit amount' },
            paymentTerms: { type: 'string', description: 'Payment terms' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            orderNumber: { type: 'string', description: 'Auto-generated order number' },
            customer: { type: 'string', description: 'Customer ID' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  inventoryItem: { type: 'string', description: 'Inventory item ID' },
                  quantity: { type: 'number' },
                  unitPrice: { type: 'number' },
                  discount: { type: 'number', description: 'Discount percentage' },
                  taxAmount: { type: 'number' },
                  totalAmount: { type: 'number' }
                }
              }
            },
            subtotal: { type: 'number' },
            discountAmount: { type: 'number' },
            cgst: { type: 'number' },
            sgst: { type: 'number' },
            igst: { type: 'number' },
            totalAmount: { type: 'number' },
            status: { 
              type: 'string', 
              enum: ['draft', 'confirmed', 'dispatched', 'delivered', 'cancelled']
            },
            expectedDelivery: { type: 'string', format: 'date-time' },
            notes: { type: 'string' },
            statusHistory: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  note: { type: 'string' },
                  changedBy: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            },
            createdBy: { type: 'string', description: 'User ID who created the order' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Invoice: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            invoiceNumber: { type: 'string', description: 'Auto-generated invoice number' },
            orderId: { type: 'string', description: 'Related order ID' },
            customer: { type: 'string', description: 'Customer ID' },
            invoiceDate: { type: 'string', format: 'date-time' },
            dueDate: { type: 'string', format: 'date-time' },
            subtotal: { type: 'number' },
            discountAmount: { type: 'number' },
            cgst: { type: 'number' },
            sgst: { type: 'number' },
            igst: { type: 'number' },
            totalAmount: { type: 'number' },
            paidAmount: { type: 'number' },
            balanceAmount: { type: 'number' },
            status: { type: 'string', enum: ['unpaid', 'partial', 'paid', 'overdue'] },
            payments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  paymentDate: { type: 'string', format: 'date-time' },
                  mode: { type: 'string', enum: ['Cash', 'Cheque', 'NEFT', 'RTGS', 'UPI'] },
                  reference: { type: 'string' },
                  notes: { type: 'string' }
                }
              }
            },
            notes: { type: 'string' },
            termsAndConditions: { type: 'string' },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', description: 'Total number of items' },
            page: { type: 'integer', description: 'Current page number' },
            limit: { type: 'integer', description: 'Items per page' },
            totalPages: { type: 'integer', description: 'Total number of pages' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication and authorization' },
      { name: 'Inventory', description: 'Steel pipe inventory management' },
      { name: 'Customers', description: 'Customer management' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Invoices', description: 'Invoice management' },
      { name: 'Reports', description: 'Business reports and analytics' }
    ]
  },
  apis: ['./routes/*.js', './controllers/*.js']
};

module.exports = swaggerJsdoc(options);
