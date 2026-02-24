# Snackoh Bakers Management System — Employee Training Guide

**Version 2.0 | Last Updated: February 2026**

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [System Overview](#2-system-overview)
3. [User Roles & Access Levels](#3-user-roles--access-levels)
4. [Logging In](#4-logging-in)
5. [Navigating the System](#5-navigating-the-system)
6. [Role-Specific Guides](#6-role-specific-guides)
   - [POS Attendant / Cashier](#61-pos-attendant--cashier)
   - [Rider / Driver](#62-rider--driver)
   - [Baker / Production Staff](#63-baker--production-staff)
   - [Sales Staff](#64-sales-staff)
   - [Administrator](#65-administrator)
7. [Module Reference](#7-module-reference)
   - [Dashboard](#71-dashboard)
   - [POS System](#72-pos-system)
   - [Production Modules](#73-production-modules)
   - [Sales & Orders](#74-sales--orders)
   - [Inventory](#75-inventory)
   - [Outlets / Branch Management](#76-outlets--branch-management)
   - [Finance](#77-finance)
   - [People / HR](#78-people--hr)
   - [System Administration](#79-system-administration)
8. [Online Store & Website Orders](#8-online-store--website-orders)
9. [Account Management](#9-account-management)
10. [Frequently Asked Questions](#10-frequently-asked-questions)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Getting Started

### What is the Snackoh Bakers Management System?

The Snackoh Bakers Management System is a web-based application that helps manage all aspects of the bakery business — from production and inventory to sales, deliveries, and branch management. It can be accessed from any device with a web browser (computer, tablet, or phone).

### System Requirements

- A modern web browser (Chrome, Safari, Firefox, or Edge)
- An internet connection
- Your login credentials (email and password) — provided by your administrator

### Installing as an App (Optional)

The system supports installation as a Progressive Web App (PWA) on your device:

1. When you log in, look for the **"Install App"** button in the sidebar
2. Click it to install Snackoh as an app on your device
3. You can then launch it like any other app from your home screen

---

## 2. System Overview

The Snackoh system is organized into the following major areas:

| Area | What it does |
|------|-------------|
| **Dashboard** | Overview of key business metrics and quick actions |
| **POS System** | Process in-store sales, accept payments, print receipts |
| **Production** | Manage recipes, schedule production runs, track batches |
| **Sales & Orders** | Handle customer orders, deliveries, and pricing |
| **Inventory** | Track raw materials, stock levels, and purchasing |
| **Outlets** | Manage multiple branch locations |
| **Finance** | Track expenses, debtors, and creditors |
| **People** | Manage employees, productivity, and roles |
| **System** | Reports, audit logs, and system settings |

**Important:** You will only see the modules relevant to your role. For example, a rider will see delivery-related modules, while a baker will see production modules.

---

## 3. User Roles & Access Levels

The system has the following roles, each with specific access rights:

### Administrator / Super Admin
- **Full access** to every module in the system
- Can manage employees, roles, and permissions
- Can view all reports, audit logs, and system settings
- Can impersonate other users for troubleshooting

### POS Attendant / Cashier
- **Dashboard** — POS-focused stats (revenue, orders)
- **POS System** — Process sales, accept payments, manage shifts
- **Orders** — View and manage customer orders
- **Account Settings** — Personal profile and password

### Rider / Driver
- **Dashboard** — Delivery-focused stats (total deliveries, pending deliveries)
- **Delivery** — View assigned deliveries, update delivery status
- **Order Tracking** — Track order progress and delivery routes
- **Rider Reports** — Submit damage, waste, or incident reports
- **Account Settings** — Personal profile and password

### Baker / Production Staff
- **Dashboard** — Production-focused stats (recipes, products, production runs)
- **Recipes & Products** — View and manage recipe definitions
- **Product Catalogue** — View allergens, nutrition info, and certifications
- **Production Runs** — Schedule and track production batches
- **Picking Lists** — View ingredient lists needed for batches
- **Lot Tracking** — Track batch numbers, expiry dates, and traceability
- **Waste Control** — Record and analyze production waste
- **Account Settings** — Personal profile and password

### Sales Staff
- **Dashboard** — Sales-focused stats (revenue, orders, deliveries)
- **Orders** — Create and manage customer orders
- **Delivery** — Schedule deliveries and assign drivers
- **Order Tracking** — Track order delivery progress
- **Customers** — Manage customer profiles and contacts
- **Pricing** — View retail and wholesale pricing tiers
- **Account Settings** — Personal profile and password

### Viewer
- **Account Settings** only — Read-only access, no module access

---

## 4. Logging In

### How to Log In

1. Open your web browser and go to the system URL
2. You will see the **Login** page
3. Enter your **email address** and **password**
4. Click **Sign In**
5. You will be redirected to the Dashboard

### Important Notes

- Your login credentials are provided by the administrator when your employee account is created
- If you forget your password, contact your administrator to reset it
- Your login activity is tracked (login time, last activity) for security purposes
- Do not share your login credentials with anyone

---

## 5. Navigating the System

### Sidebar Navigation

The left sidebar is your main navigation tool. It is organized into color-coded groups:

- **Blue (CORE)** — Dashboard and POS
- **Amber (PRODUCTION)** — Recipes, production, picking lists, lot tracking, waste control
- **Green (SALES & ORDERS)** — Customers, orders, delivery, pricing
- **Purple (INVENTORY)** — Stock, purchasing, suppliers, assets
- **Orange (OUTLETS)** — Branch management, outlet inventory, requisitions
- **Rose (FINANCE)** — Expenses, debtors, creditors
- **Teal (PEOPLE)** — Employees, productivity, roles
- **Gray (SYSTEM)** — Reports, audit logs, settings
- **Indigo (MY ACCOUNT)** — Your personal account settings

### Sidebar Controls

- Click the **arrow button** (top of sidebar) to collapse or expand the sidebar
- When collapsed, hover over icons to see tooltips
- The active page is highlighted with a colored left border

### Header

The top header bar includes:
- Notifications bell icon
- Your user profile and role indicator
- Quick access to account settings and logout

---

## 6. Role-Specific Guides

### 6.1 POS Attendant / Cashier

Your primary workspace is the **POS System**. Here is your typical workflow:

#### Starting a Shift
1. Navigate to **POS System** from the sidebar
2. The system will track your shift automatically
3. Note the opening balance if required

#### Processing a Sale
1. In the POS screen, search for or browse products
2. Click on products to add them to the current sale
3. Adjust quantities as needed using the +/- buttons
4. Select the customer type (Retail or Wholesale) for correct pricing
5. Choose a payment method:
   - **Cash** — Enter the amount received; the system calculates change
   - **M-Pesa** — Enter the customer's phone number and send an STK push payment request
   - **Card** — Process using the connected card reader
   - **Credit** — Record the sale as a debt (customer pays later)
6. Click **Complete Sale** to finalize
7. A receipt is generated automatically — print or share it

#### Viewing Orders
1. Navigate to **Orders** from the sidebar
2. View all orders including Regular, Online, and On-Call orders
3. Update order status as needed (e.g., mark as Ready, Delivered)

#### End of Shift
1. Review the day's sales in the POS summary
2. Reconcile the cash drawer with the system total
3. Log out when your shift is complete

---

### 6.2 Rider / Driver

Your workspace focuses on deliveries and order tracking.

#### Viewing Your Deliveries
1. Navigate to **Delivery** from the sidebar
2. View all assigned deliveries with status, destination, and customer details
3. Deliveries are sorted by schedule date

#### Updating Delivery Status
1. Open a delivery record
2. Update the status:
   - **Pending** — Not yet picked up
   - **In Transit** — On the way to the customer
   - **Delivered** — Successfully delivered
   - **Failed** — Could not deliver (add notes explaining why)
3. Save the update

#### Tracking Orders
1. Navigate to **Order Tracking**
2. View order status and delivery progress for all assigned orders
3. Use this to stay informed about what needs to go out

#### Submitting Reports
1. Navigate to **Rider Reports**
2. Click **New Report** to submit a report
3. Types of reports:
   - **Damage Report** — Products damaged during transport
   - **Waste Report** — Products returned or disposed of
   - **Incident Report** — Any issues during delivery
4. Fill in the details and submit

---

### 6.3 Baker / Production Staff

Your workspace covers everything related to production.

#### Viewing Recipes
1. Navigate to **Recipes & Products**
2. Browse all recipes with their ingredients, costs, and output quantities
3. Each recipe shows the exact ingredients and measurements needed

#### Starting a Production Run
1. Navigate to **Production Runs**
2. Click **New Production Run**
3. Select the recipe/product to produce
4. Enter the quantity and scheduled date
5. Submit to create the production run

#### Using Picking Lists
1. Navigate to **Picking Lists**
2. View the ingredient lists for upcoming production batches
3. Use this as your preparation checklist — gather all ingredients before starting

#### Tracking Lots
1. Navigate to **Lot Tracking**
2. View batch numbers, production dates, and expiry dates
3. Use this for traceability — track which batch went where

#### Recording Waste
1. Navigate to **Waste Control**
2. Click **Record Waste**
3. Enter the product, quantity wasted, and reason
4. This data helps management identify and reduce waste

#### Product Catalogue
1. Navigate to **Product Catalogue**
2. View and update allergen information, nutrition facts, and certifications
3. This information is important for food safety compliance

---

### 6.4 Sales Staff

Your workspace focuses on orders, customers, and deliveries.

#### Creating an Order
1. Navigate to **Orders**
2. Click **New Order**
3. Select the customer (or create a new one)
4. Add products to the order
5. Choose fulfillment type (Delivery or Pickup)
6. Set payment method and status
7. Save the order

#### Managing Customers
1. Navigate to **Customers**
2. View all customer profiles with contact info and order history
3. Add new customers or update existing ones
4. Use customer segmentation for targeted service

#### Scheduling Deliveries
1. Navigate to **Delivery**
2. View all pending deliveries
3. Assign drivers to deliveries
4. Set delivery dates and routes

#### Pricing
1. Navigate to **Pricing**
2. View and manage retail and wholesale pricing tiers
3. Update prices as directed by management

---

### 6.5 Administrator

As an administrator, you have full access to every module. Key responsibilities include:

#### Managing Employees
1. Navigate to **Employees** under People
2. Add new employees with their details, role, and login credentials
3. Set the **Login Role** to control what modules they can access:
   - `Admin` / `Super Admin` / `Administrator` — Full access
   - `Cashier` — POS and orders only
   - `Baker` — Production modules only
   - `Rider` / `Driver` — Delivery modules only
   - `Sales` — Sales, orders, and customer modules
   - `Viewer` — Account page only
4. Enable or disable **System Access** for each employee
5. Assign specific permissions if needed

#### Managing Roles & Permissions
1. Navigate to **Roles & Permissions**
2. View all defined roles and their associated permissions
3. Create custom roles with specific permission combinations
4. Assign roles to employees

#### System Settings
1. Navigate to **Settings**
2. Configure:
   - Business name and logo
   - Receipt settings
   - M-Pesa integration settings
   - Theme and display preferences

#### Managing Outlets / Branches
1. Navigate to **Branch Management** under Outlets
2. Add and configure new branch locations
3. Assign employees to specific branches
4. Set one branch as the **Main Branch**
5. Manage branch-specific inventory, products, and settings

#### Viewing Reports
1. Navigate to **Reports & Ledger** under System
2. View financial reports including:
   - Profit & Loss statements
   - Sales reports
   - Debtor and creditor reports
   - General ledger entries

#### Audit Logs
1. Navigate to **Audit Logs**
2. View all system activity including:
   - Who logged in and when
   - What records were created, updated, or deleted
   - Module-level activity tracking

#### Admin Impersonation
For troubleshooting, administrators can view the system as another user:
1. Navigate to the impersonation page
2. Select the employee to impersonate
3. The system will show you exactly what that user sees
4. A yellow banner indicates impersonation is active
5. Click **End Impersonation** to return to your admin account

---

## 7. Module Reference

### 7.1 Dashboard

The Dashboard is your home screen. It shows different information depending on your role:

- **Administrators** see all metrics: recipes, products, employees, orders, inventory, revenue, outlets, and requisitions
- **Cashiers** see revenue and order counts
- **Riders** see total deliveries and pending deliveries
- **Bakers** see recipe counts, products, and production runs
- **Sales Staff** see revenue, orders, and pending deliveries

The Dashboard also includes **Quick Actions** — shortcut buttons to the most common tasks for your role.

### 7.2 POS System

The Point of Sale system is used for processing in-store sales.

**Key Features:**
- Product search and browsing
- Cart management (add, remove, adjust quantities)
- Customer type selection (Retail / Wholesale) for pricing
- Multiple payment methods: Cash, M-Pesa, Card, Credit
- Receipt generation and printing
- Shift management (opening/closing balance)
- Non-inventory items for custom/special orders
- Support for discounts

**Payment Methods:**
| Method | How it works |
|--------|-------------|
| Cash | Enter amount received; system calculates change |
| M-Pesa | Send STK push to customer's phone; they enter PIN |
| Card | Process through connected card reader |
| Credit | Sale recorded as debt; customer pays later |

### 7.3 Production Modules

#### Recipes & Products
- Define recipes with ingredients, measurements, and costs
- Calculate production costs per unit
- Link recipes to finished products

#### Product Catalogue (Food Info)
- Manage allergen information per product
- Record nutritional values
- Track food safety certifications
- Important for regulatory compliance

#### Production Runs
- Schedule production batches
- Track batch status: Scheduled, In Progress, Completed
- Record actual output vs. planned output
- Link to recipes for ingredient requirements

#### Picking Lists
- Auto-generated ingredient lists for production batches
- Use as a checklist when preparing ingredients
- Helps ensure nothing is missed before production starts

#### Lot Tracking
- Assign lot/batch numbers to production runs
- Track expiry dates for each batch
- Full traceability from production to sale
- Essential for food safety and recall management

#### Waste Control
- Record production waste with reasons
- Track waste by product, date, and cause
- Management uses this data to reduce waste over time

### 7.4 Sales & Orders

#### Customers
- Customer profiles with name, phone, email, location
- Order history per customer
- Customer segmentation (Retail, Wholesale, etc.)
- Geo-location data for delivery planning

#### Orders
Three types of orders are managed:
1. **Regular Orders** — Standard in-store or phone orders
2. **Online Orders** — Placed through the website
3. **On-Call Orders** — Placed via phone or walk-in

**Order Statuses:**
- Pending → Confirmed → Processing → Ready → Shipped → Delivered
- On Hold (for WhatsApp/unconfirmed orders)
- Cancelled

**Payment Statuses:**
- Unpaid, Pay on Delivery, Paid, M-Pesa Pending

#### Order Tracking
- Real-time order status tracking
- Delivery progress monitoring
- Customer notification updates

#### Delivery
- Schedule deliveries with dates and assigned drivers
- Track delivery status (Pending, In Transit, Delivered, Failed)
- Auto-generated tracking numbers (DEL-XXXXX)
- Customer contact information for each delivery

#### Rider Reports
- Damage reports for products damaged in transit
- Waste reports for unsold or returned items
- Incident reports for delivery issues

#### Pricing
- Set retail and wholesale pricing tiers
- Manage product pricing per tier
- Price history tracking

### 7.5 Inventory

#### Inventory Management
- Track raw materials, packaging, and stock levels
- Set minimum stock levels for reorder alerts
- Categorize items by type

#### Stock Reorder
- Automatic low-stock alerts
- Create stock requisitions
- Trigger production runs when finished goods are low

#### Purchasing
- Create purchase orders for suppliers
- Track order status (Pending, Ordered, Received)
- Record delivery of purchased goods

#### Suppliers
- Manage supplier/distributor profiles
- Track supplier pricing and payment terms
- Contact information and order history

#### Distributors
- Manage distribution agents
- Track distribution sales and performance

#### Assets
- Equipment and vehicle tracking
- Depreciation calculations
- Maintenance scheduling

### 7.6 Outlets / Branch Management

#### Branch Management
- Add and configure multiple bakery locations
- Designate one location as the **Main Branch**
- Track branch status (Active / Inactive)

#### Outlet Inventory
- Per-branch inventory tracking
- Transfer stock between branches

#### Outlet Requisitions
- Branches request products from the main bakery
- Approval workflow for requisitions
- Track requisition status (Pending, Approved, Fulfilled)

#### Outlet Returns
- Return unsold items from branches to main bakery
- Maintain freshness by rotating stock

#### Outlet Products
- Branch-specific product catalog
- Custom pricing per branch if needed

#### Branch Employees
- Assign employees to specific branches
- Set outlet-specific roles (Admin, Manager, Staff)

#### Branch Reports
- Per-branch sales reports
- Inventory and performance reports

#### Branch Waste
- Track waste at each branch location
- Compare waste levels across branches

#### Branch Settings
- Receipt customization per branch
- POS configuration per branch
- Display settings

### 7.7 Finance

#### Expenses
- Record business expenses with categories
- Track spending over time
- Receipt uploads and documentation

#### Debtors
- Track credit sales and customer debts
- Payment history and outstanding balances
- Follow up on overdue payments

#### Creditors
- Track amounts owed to suppliers
- Payment schedules and due dates
- Record payments made

### 7.8 People / HR

#### Employees
- Employee profiles with personal and contact details
- Employment information (position, department, hire date)
- Login credentials management
- Certificate and document tracking
- Payroll information
- System access control (enable/disable)

#### Productivity Report
- Employee KPI tracking
- Performance metrics and scoring
- Productivity comparisons

#### Roles & Permissions
- Define custom roles
- Assign granular permissions to roles
- View which employees have which roles

### 7.9 System Administration

#### Reports & Ledger
- Financial reports: Profit & Loss, Sales, Debtor/Creditor
- General ledger entries
- Export capabilities

#### Audit Logs
- Complete activity log for the system
- Track who did what and when
- Filter by user, action type, module, or date range

#### Settings
- Business information (name, logo, contact)
- Receipt configuration
- M-Pesa integration settings
- Theme and display preferences
- Security settings

---

## 8. Online Store & Website Orders

The Snackoh bakery has a public-facing online store where customers can browse products and place orders.

### How Online Ordering Works

1. Customers visit the shop website
2. They browse products and add items to their cart
3. At checkout, they choose:
   - **Delivery** — Ship to their address (free for orders KES 2,000+)
   - **Pickup** — Collect from the bakery
4. Payment is made via **M-Pesa** (STK push sent to their phone)
5. Once payment is confirmed, the order is saved as "Confirmed"
6. A delivery record is automatically created for shipped orders

### Managing Online Orders (Admin/Sales)

1. Go to **Orders** and switch to the **Online Orders** tab
2. Review incoming online orders
3. Confirm or update order status
4. Assign deliveries to riders

### Payment Method

Currently, the online store accepts **M-Pesa only** for payments. Customers receive an STK push notification on their phone and enter their M-Pesa PIN to complete the payment.

---

## 9. Account Management

All employees can manage their personal account regardless of role.

### Accessing Your Account
1. Click **Account Settings** in the sidebar (bottom section)
2. Or click your profile in the top header

### What You Can Do
- View and update your profile information
- Change your password
- View your role and assigned permissions
- Update your contact details

---

## 10. Frequently Asked Questions

### Q: I can't see certain modules in the sidebar. Why?

**A:** The system shows only the modules relevant to your role. If you need access to additional modules, ask your administrator to update your role or permissions.

### Q: I forgot my password. What do I do?

**A:** Contact your administrator. They can reset your password from the Employees module.

### Q: How do I process an M-Pesa payment in POS?

**A:** In the POS system, select M-Pesa as the payment method, enter the customer's phone number, and click to send the STK push. The customer will receive a prompt on their phone to enter their M-Pesa PIN. Once confirmed, the payment is recorded automatically.

### Q: How do I know if a delivery is assigned to me?

**A:** Go to the **Delivery** module. Your assigned deliveries will be listed there with status, destination, and customer details.

### Q: Can I use the system on my phone?

**A:** Yes! The system is responsive and works on phones and tablets. You can also install it as an app using the "Install App" button in the sidebar.

### Q: What is the difference between Regular, Online, and On-Call orders?

**A:**
- **Regular Orders** — Created directly in the system by staff
- **Online Orders** — Placed by customers through the website
- **On-Call Orders** — Placed by customers over the phone

### Q: How do I record production waste?

**A:** Go to **Waste Control** → Click **Record Waste** → Select the product, enter the quantity, and choose a reason. This helps management track and reduce waste.

### Q: What does "On Hold" order status mean?

**A:** An "On Hold" order is waiting for payment confirmation. Once payment is verified by the admin team, the order will move to "Confirmed" status.

---

## 11. Troubleshooting

### Problem: The page keeps loading and doesn't show any content

**Solution:** Try the following:
1. Refresh the page (Ctrl+R or Cmd+R)
2. Clear your browser cache
3. Log out and log back in
4. If the issue persists, contact your administrator

### Problem: I'm redirected to the Account page when I try to access a module

**Solution:** Your role doesn't have permission to access that module. Contact your administrator if you believe you should have access.

### Problem: M-Pesa STK push is not being sent

**Solution:**
1. Verify the phone number is correct (format: 0712 345 678 or 254712345678)
2. Ensure the customer's phone is on and has network coverage
3. Try again after a few seconds
4. If it continues to fail, contact your administrator to check M-Pesa settings

### Problem: I can't see any products in POS

**Solution:** Products need to be added to the system first. Contact your administrator or go to Recipes/Products to add items.

### Problem: The app installed on my phone isn't working

**Solution:**
1. Make sure you have an internet connection
2. Try uninstalling and reinstalling the app
3. Use the browser version as a fallback

---

*This guide is for the Snackoh Bakers Management System v2.0. For system updates or additional help, contact your system administrator.*
