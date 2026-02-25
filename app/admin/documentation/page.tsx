'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpenText, ExternalLink, ArrowUp } from 'lucide-react';

const markdownContent = `# Snackoh Bakers - Employee Training Manual

## System Overview

The Snackoh Bakers Management System is a comprehensive bakery ERP (Enterprise Resource Planning) and e-commerce platform. It manages everything from production and inventory to sales, deliveries, and multi-branch operations. Each employee has access only to the modules relevant to their role.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Employee Roles](#2-employee-roles)
3. [Dashboard](#3-dashboard)
4. [POS System (Point of Sale)](#4-pos-system)
5. [Production Modules](#5-production-modules)
6. [Sales & Orders Modules](#6-sales--orders-modules)
7. [Inventory Modules](#7-inventory-modules)
8. [Outlet (Branch) Modules](#8-outlet-branch-modules)
9. [Finance Modules](#9-finance-modules)
10. [People Management Modules](#10-people-management-modules)
11. [System & Settings Modules](#11-system--settings-modules)
12. [E-Commerce Website](#12-e-commerce-website)
13. [Roles & Permissions Guide (Admin)](#13-roles--permissions-guide)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting Started

### Logging In

1. Open your web browser and navigate to the Snackoh Bakers system URL.
2. Click the **Staff Admin** icon (person icon) in the top-right of the website, or go directly to \`/auth/login\`.
3. Enter your **email address** and **password** provided by your administrator.
4. Click **Sign In**.

If you cannot log in:
- Make sure your email is correct (check with your manager).
- Your account must have **System Access** enabled by an administrator.
- If your password is forgotten, contact your administrator for a reset.

### Your Account Settings

Once logged in, go to **Account Settings** (bottom of the sidebar) to:
- View your profile information.
- Update your password.
- Manage your certificates and personal info.

![Account Settings — View and manage your profile, password, and personal information](/docs/account-settings.png)
*Figure 1: Account Settings page where employees can update their profile and password.*

### Navigation

- The **sidebar** (left panel) shows only the modules you have access to.
- The **header** (top bar) shows your name, role, notifications, and logout option.
- Click the **collapse button** (arrow) to minimize the sidebar for more screen space.
- If you see a notification bell ringing red, there is a new online order waiting for review.

### Installing the App

The system can be installed as an app on your phone or computer:
1. Look for the **Install App** button in the sidebar or header.
2. Click it to install the system as a standalone app.
3. You can then access it directly from your home screen.

---

## 2. Employee Roles

Each employee is assigned a role that determines what they can see and do in the system. Here are the standard roles:

### Administrator / Super Admin
- **Full access** to all modules and settings.
- Can manage employees, roles, permissions, and system configuration.
- Can impersonate other users for troubleshooting.
- Both "Admin", "Administrator", and "Super Admin" login roles grant full access.

### Outlet Admin / Branch Manager
- Employees assigned as **Admin** or **Manager** at a specific outlet automatically gain access to all outlet/branch modules.
- This access is granted in addition to their base role permissions.
- **Automatic modules:** Branch Management, Outlet Inventory, Outlet Requisitions, Outlet Returns, Outlet Products, Branch Employees, Branch Reports, Branch Waste, Branch Settings.

### Baker
- **Production-focused** access.
- **Modules:** Dashboard, Recipes & Products, Product Catalogue, Production Runs, Picking Lists, Lot Tracking, Waste Control, Account Settings.
- **Cannot access:** Orders, POS, Inventory, Finance, Employees, or Settings.

### Cashier / POS Attendant
- **Sales-focused** access.
- **Modules:** Dashboard, POS System, Orders, Customers, Account Settings.
- **Cannot access:** Production, Inventory management, Finance, Employees, or Settings.

### Sales
- **Order and customer management** access.
- **Modules:** Dashboard, Orders, Order Tracking, Delivery, Customers, Pricing, Account Settings.
- **Cannot access:** Production, detailed Inventory, Finance, Employees, or Settings.

### Rider / Driver
- **Delivery-focused** access (strictly restricted).
- **Modules:** Dashboard, Delivery, Order Tracking, Rider Reports, Account Settings.
- **Cannot access any other module** regardless of additional permissions.

### Viewer
- **Minimal** access — only the Account Settings page by default.
- Additional access must be explicitly granted via permissions in the Roles & Permissions module.
- Suitable for employees who need read-only access to specific modules.

### Custom Roles
Administrators can create custom roles (e.g., Branch Manager, Inventory Clerk) with specific permissions.

---

## 3. Dashboard

**Who can see this:** All roles (with "View Dashboard" permission)

The Dashboard provides a quick overview of the business:
- **Key Performance Indicators (KPIs):** Revenue, orders, customers, production metrics.
- **Recent Activity:** Latest orders, deliveries, and system events.
- **Quick Actions:** Shortcuts to common tasks.

![Dashboard — Overview of key business metrics and recent activity](/docs/dashboard.png)
*Figure 2: The main Dashboard showing KPIs, recent orders, and quick-action shortcuts.*

---

## 4. POS System

**Who can see this:** Cashier, POS Attendant, Admin (or anyone with "Access POS" permission)

The Point of Sale module is used for in-store sales:
- **Process Sales:** Add products, set quantities, apply discounts.
- **Accept Payments:** M-Pesa, cash, and other payment methods.
- **Print Receipts:** Generate customer receipts.
- **Daily Transactions:** View sales history for the current shift.

![POS System — Process in-store sales with product search, payment, and receipt generation](/docs/pos.png)
*Figure 3: The POS System interface for processing in-store sales with product browsing, cart management, and payment options.*

### How to Process a Sale:
1. Open **POS System** from the sidebar.
2. Search or browse products to add to the order.
3. Adjust quantities as needed.
4. Select the payment method (M-Pesa or Cash).
5. Complete the transaction and print/share the receipt.

---

## 5. Production Modules

**Who can see this:** Baker, Admin (or anyone with "Manage Recipes" permission)

### 5.1 Recipes & Products
- Create and manage recipes with detailed ingredients and costing.
- Set product prices based on ingredient costs and margins.
- Track recipe variations and versions.

![Recipes Overview — View all recipes with ingredients, costing, and product details](/docs/recipe.png)
*Figure 4: The Recipes overview listing all recipes with their ingredients, costing information, and product links.*

![AI Recipe Generation — Use AI to auto-generate recipe details and ingredient lists](/docs/recipe-ai.png)
*Figure 5: The AI Recipe tool that automatically generates recipe details, ingredient lists, and costing estimates.*

![Manual Recipe — Create and manage detailed recipes with ingredients and costing](/docs/manual-recipe.png)
*Figure 6: The Manual Recipe page where bakers define ingredients, quantities, and costing for each product.*

### 5.2 Product Catalogue
- Manage allergen information for each product.
- Add nutritional facts and certifications.
- Mark halal, vegan, gluten-free, or other dietary labels.

![Product Catalogue — View and manage all products with allergen info and dietary labels](/docs/product.png)
*Figure 7: The Product Catalogue listing all products with their allergen information, dietary labels, and pricing.*

![Add Product — Create a new product entry with details, allergens, and nutritional facts](/docs/product-add.png)
*Figure 8: Adding a new product to the catalogue with allergen details, nutritional information, and dietary labels.*

### 5.3 Production Runs
- Schedule production batches for the day/week.
- Track batch status: Planned, In Progress, Completed.
- Record actual output vs. planned output.

![Production Runs — Schedule and track production batches with status monitoring](/docs/production-runs-batch.png)
*Figure 9: The Production Runs page showing scheduled batches with their status, planned output, and progress.*

![Add Production Run — Create a new production batch with product selection and scheduling](/docs/production-runs-batch-add.png)
*Figure 10: Creating a new production run batch with product selection, quantity targets, and scheduling details.*

### 5.4 Picking Lists
- Auto-generated ingredient lists for scheduled production runs.
- Used by bakers to gather ingredients before production.
- Helps ensure all materials are available.

![Add Picking List — Create a new picking list for scheduled production runs](/docs/add-picking-list.png)
*Figure 11: Adding a new picking list to prepare ingredients for a production batch.*

### 5.5 Lot Tracking
- Track production batch numbers for traceability.
- Record expiry dates and shelf life.
- Trace any product back to its production batch if quality issues arise.

![Lot Tracking Overview — View all tracked production lots with batch numbers and expiry dates](/docs/lot-tracking.png)
*Figure 12: The Lot Tracking overview listing all production batches with their status, batch numbers, and expiry dates.*

![Add Lot — Record a new production lot with batch number and expiry date](/docs/add-lot.png)
*Figure 13: Adding a new lot entry to track batch numbers and expiry dates for traceability.*

### 5.6 Waste Control
- Record and categorize production waste.
- Track waste by product type, cause (overproduction, damage, expiry).
- Analyze waste patterns to reduce losses.

![Add Waste Record — Log production waste by product type and cause](/docs/ad-waste.png)
*Figure 14: Recording waste in the Waste Control module to track and reduce production losses.*

---

## 6. Sales & Orders Modules

### 6.1 Customers
**Who can see this:** Sales, Cashier, Admin (or anyone with "Manage Customers" permission)

- View customer profiles, contact info, and order history.
- Segment customers by location, purchase frequency, etc.
- Track customer geo-location data for delivery planning.

![Customer Management — View and manage customer profiles and order history](/docs/customer.png)
*Figure 15: The Customer Management page showing customer profiles, contact details, and order history.*

![Add Customer — Create a new customer profile with contact and location details](/docs/ad-customer.png)
*Figure 16: Adding a new customer record with contact information and delivery location.*

### 6.2 Orders
**Who can see this:** Sales, Cashier, Admin (or anyone with "Manage Orders" permission)

- **Create Orders:** New orders for customers (walk-in, phone, or online).
- **Manage Orders:** Update status (Pending, Confirmed, In Production, Ready, Delivered).
- **Online Orders:** Review and confirm orders from the website (M-Pesa payments).

![Orders Overview — View and manage all customer orders with status tracking](/docs/orders.png)
*Figure 17: The Orders page showing all orders with their current status, customer details, and payment information.*

![Manual Order — Create a new order manually for walk-in or phone customers](/docs/orders-manual.png)
*Figure 18: Creating a manual order with product selection, customer details, and payment method.*

### How to Process an Online Order:
1. You will hear an **alarm** when a new online order arrives.
2. Click the notification bell or go to **Orders**.
3. Review the order details and payment status.
4. Confirm the order to begin processing.
5. Update the status as it moves through production and delivery.

### 6.3 Order Tracking
**Who can see this:** Sales, Rider, Admin (or anyone with "Manage Deliveries" permission)

- Track real-time status of all orders.
- View delivery progress and ETAs.
- Filter by status, date, or customer.

![Order Tracking — Track real-time status and progress of all orders](/docs/orders-tracking.png)
*Figure 19: The Order Tracking page showing all orders with real-time status updates, filters, and delivery progress.*

![Order Tracking Detail — Detailed view of a specific order's delivery timeline](/docs/order-tracking-detail.png)
*Figure 20: A detailed order tracking view showing the full delivery timeline and status milestones.*

### 6.4 Delivery
**Who can see this:** Sales, Rider, Admin (or anyone with "Manage Deliveries" permission)

- Schedule deliveries and assign riders/drivers.
- View delivery routes and assignments.
- Track delivery completion and customer feedback.

![Delivery Overview — View all scheduled deliveries with rider assignments and status](/docs/delivery.png)
*Figure 21: The Delivery module showing all deliveries with assigned riders, routes, and completion status.*

![Add Delivery — Schedule a new delivery with rider assignment and route details](/docs/delivery-add.png)
*Figure 22: Creating a new delivery assignment with rider selection, route, and delivery schedule.*

### How to Assign a Delivery:
1. Go to **Delivery** module.
2. Find the order that needs delivery.
3. Assign an available rider/driver.
4. The rider will see the delivery in their dashboard.

### 6.5 Rider Reports
**Who can see this:** Rider, Sales, Admin (or anyone with "Manage Deliveries" permission)

- Riders can report damaged or wasted products during delivery.
- Record reasons for delivery issues (e.g., customer not available, product damage).
- Used for accountability and loss tracking.

### 6.6 Pricing
**Who can see this:** Sales, Admin (or anyone with "Manage Pricing" permission)

- Set and manage retail and wholesale pricing tiers.
- Create bulk pricing rules and discounts.
- Compare pricing across product categories.

![Pricing Overview — View and manage retail and wholesale pricing tiers](/docs/pricing.png)
*Figure 23: The Pricing page showing product pricing tiers, bulk rules, and category comparisons.*

![Add Pricing — Create a new pricing tier or discount rule for products](/docs/pricing-add.png)
*Figure 24: Adding a new pricing tier with product selection, price levels, and discount rules.*

---

## 7. Inventory Modules

**Who can see this:** Admin (or anyone with "Manage Inventory" permission)

### 7.1 Inventory
- Track raw materials, packaging, and finished goods stock levels.
- View stock alerts for low-quantity items.
- Record stock movements (received, used, adjusted).

![Inventory Overview — Track stock levels of raw materials, packaging, and finished goods](/docs/inventory.png)
*Figure 25: The Inventory overview showing current stock levels, low-stock alerts, and item categories.*

![Add Inventory Item — Record a new stock entry with quantity and category details](/docs/inventory-add.png)
*Figure 26: Adding a new inventory item with details such as quantity, category, and reorder level.*

### 7.2 Stock Reorder
- Manage stock requisitions and reorder alerts.
- Set minimum stock levels that trigger reorder notifications.
- Link production runs to ingredient availability.

![Stock Reorder — Monitor stock levels and trigger reorders for low-stock items](/docs/stock-reorder.png)
*Figure 27: The Stock Reorder page showing stock levels, reorder alerts, and out-of-stock items with restock actions.*

![Stock Reorder Requisitions — View and manage pending stock requisitions](/docs/stock-reorder-requisitions.png)
*Figure 28: The Requisitions tab showing pending stock requests with quantities, priority, and approval actions.*

### 7.3 Purchasing
- Create and manage purchase orders for suppliers.
- Track order status: Draft, Sent, Received, Paid.
- Compare quotes from different suppliers.

![Purchasing Overview — Create and manage purchase orders for suppliers](/docs/purchasing.png)
*Figure 29: The Purchasing page showing all purchase orders with their status, supplier details, and amounts.*

![Add Purchase Order — Create a new purchase order with supplier and item selection](/docs/purchasing-add.png)
*Figure 30: Creating a new purchase order with supplier selection, item quantities, and pricing details.*

### 7.4 Suppliers
- Manage supplier profiles and contact information.
- Track supplier pricing and payment terms.
- Rate supplier reliability and quality.

### 7.5 Distributors
- Manage distribution agents and wholesale channels.
- Track distributor sales and commissions.
- Monitor distribution network performance.

![Distributors Overview — Manage distribution agents and wholesale channels](/docs/distributor.png)
*Figure 31: The Distributors page showing all distribution agents with their sales performance and commissions.*

![Add Distributor — Register a new distribution agent with contact and sales details](/docs/distributor-add.png)
*Figure 32: Adding a new distributor with contact information, commission rate, and assigned territory.*

### 7.6 Assets
- Track business equipment, vehicles, and tools.
- Record depreciation schedules.
- Manage maintenance and repair schedules.

![Asset Management — View and manage all business assets, equipment, and vehicles](/docs/asset-manage.png)
*Figure 33: The Asset Management overview showing tracked equipment, vehicles, and tools.*

![Add Asset — Register a new business asset with details and depreciation schedule](/docs/asset-add.png)
*Figure 34: Adding a new asset to the system with details such as purchase date and depreciation.*

---

## 8. Outlet (Branch) Modules

**Who can see this:** Admin (or anyone with "Manage Outlets" or "View Outlets" permission)

These modules are for managing multiple bakery locations:

### 8.1 Branch Management
- Create and manage branch outlets (e.g., CBD Branch, Westlands Branch).
- Set branch details: name, location, operating hours.
- Assign staff and managers to branches.

![Branch Overview — View all bakery branch outlets and their details](/docs/branch.png)
*Figure 35: The Branch Management page listing all outlet locations with their status and details.*

![Add Branch — Create a new branch outlet with location and operating details](/docs/branch-add.png)
*Figure 36: Adding a new branch outlet with name, location, and manager assignment.*

### 8.2 Outlet Inventory
- Track stock levels at each individual branch.
- Compare inventory across branches.
- Record stock movements between main bakery and branches.

![Outlet Inventory — Track and manage stock levels at each branch location](/docs/outlet-inventory.png)
*Figure 37: The Outlet Inventory page showing stock levels per branch with comparison and movement tracking.*

### 8.3 Outlet Requisitions
- Branches can request products from the main bakery.
- Managers can approve or reject requisitions.
- Track requisition status: Pending, Approved, Dispatched, Received.

![Outlet Requisitions — View and manage product requests from branch outlets](/docs/outlet-requisition.png)
*Figure 38: The Outlet Requisitions page showing all branch product requests with their approval status.*

![Add Outlet Requisition — Submit a new product request from a branch to the main bakery](/docs/outlet-requisition-add.png)
*Figure 39: Creating a new outlet requisition with product selection, quantities, and delivery preferences.*

### How to Submit a Requisition:
1. Go to **Outlet Requisitions**.
2. Click **New Requisition**.
3. Select the products and quantities needed.
4. Submit for approval.
5. The main bakery will review and dispatch the items.

### 8.4 Outlet Returns
- Return unsold or expired items to the main bakery.
- Track return reasons and quantities.
- Ensures freshness standards are maintained.

![Outlet Returns — Track and manage product returns from branch outlets to the main bakery](/docs/outlet-returns.png)
*Figure 40: The Outlet Returns page showing returned items with reasons, quantities, and processing status.*

### 8.5 Outlet Products
- Manage the product catalog available at each branch.
- Set branch-specific pricing if needed.
- Control which products each branch can sell.

![Outlet Products — Manage the product catalog available at each branch](/docs/outlet-products.png)
*Figure 41: The Outlet Products page showing the product catalog for each branch with pricing and availability.*

### 8.6 Branch Employees
- View and manage staff assigned to each branch.
- Track work schedules and attendance.
- Assign roles within the branch.

![Branch Employees — View and manage staff assigned to a specific branch](/docs/branch-employees.png)
*Figure 42: The Branch Employees page showing staff assigned to a branch with their roles and schedules.*

![Branch Employee Assignments — Manage employee assignments, transfers, and roles per outlet](/docs/branch-employees-assign.png)
*Figure 43: The Branch Employee assignment management view with options to view, edit, transfer, or remove staff from outlets.*

### 8.7 Branch Reports
- View sales, inventory, and performance reports per branch.
- Compare branch performance metrics.
- Identify top-performing and underperforming branches.

![Branch Reports — Sales, inventory, and performance reports for each branch](/docs/branch-reports.png)
*Figure 44: Branch Reports showing performance metrics and sales comparisons across outlets.*

### 8.8 Branch Waste
- Record waste at each branch.
- Track waste by product type and cause.
- Compare waste across branches to identify issues.

![Branch Waste — Track and compare waste records across branch outlets](/docs/branch-waste.png)
*Figure 45: The Branch Waste module showing waste entries by product type and cause per outlet.*

### 8.9 Branch Settings
- Configure receipt templates, POS settings, and display options per branch.
- Customize branch-specific operating parameters.

![Branch Settings — Configure receipt templates and POS settings for each branch](/docs/branch-settings.png)
*Figure 46: Branch Settings page where managers can configure receipts and operating parameters.*

---

## 9. Finance Modules

**Who can see this:** Admin (or anyone with "Manage Finance" permission)

### 9.1 Expenses
- Record and categorize business expenses.
- Attach receipts and supporting documents.
- Track expense approvals and payment status.

![Expenses — Record and categorize business expenses with receipt attachments](/docs/expense.png)
*Figure 47: The Expenses page showing categorized expense entries with amounts, dates, and approval status.*

### 9.2 Debtors
- Track credit sales and customer debts.
- Send payment reminders.
- Record payments and maintain customer account balances.

![Debtors — Track customer debts, credit sales, and payment status](/docs/debtor.png)
*Figure 48: The Debtors module showing outstanding customer balances and payment tracking.*

![Add Debtor — Record a new debtor entry with customer and payment details](/docs/debtor-add.png)
*Figure 49: Adding a new debtor record with customer information, amount owed, and payment terms.*

### 9.3 Creditors
- Track amounts owed to suppliers.
- Manage payment schedules and due dates.
- Record payments made to suppliers.

![Creditors Overview — Track amounts owed to suppliers with payment schedules](/docs/creditor.png)
*Figure 50: The Creditors page showing supplier balances, due dates, and payment status.*

![Add Creditor — Record a new creditor entry with supplier and payment details](/docs/creditor-add.png)
*Figure 51: Adding a new creditor record with supplier information and payment terms.*

---

## 10. People Management Modules

### 10.1 Employees
**Who can see this:** Admin (or anyone with "Manage Employees" permission)

- Manage staff profiles, emergency contacts, and personal details.
- Track certificates, licenses, and training records.
- Manage payroll information and salary details.
- Enable or disable system access for each employee.

![Employees — Manage staff profiles, payroll, and system access](/docs/employee.png)
*Figure 52: The Employees page showing all staff members with their roles, contact details, and system access status.*

### How to Add a New Employee:
1. Go to **Employees** module.
2. Click **Add Employee**.
3. Fill in personal details, role, and login credentials.
4. Set **System Access** to "Enabled" and assign a **Login Role**.
5. The employee will receive login credentials via email.

### 10.2 Productivity Report
**Who can see this:** Admin (or anyone with "View Reports" or "Manage Employees" permission)

- Track employee KPIs and performance metrics.
- View attendance, output, and efficiency data.
- Generate performance reports for reviews.

![Employee Productivity Report — Track employee KPIs, attendance, and performance metrics](/docs/employee-productivity-report.png)
*Figure 53: The Productivity Report showing employee performance metrics, attendance data, and efficiency ratings.*

### 10.3 Roles & Permissions
**Who can see this:** Admin only (or anyone with "System Settings" permission)

- Create and manage user roles.
- Assign granular permissions to each role.
- See the full guide in [Section 13](#13-roles--permissions-guide).

![Roles Overview — View all defined user roles in the system](/docs/roles.png)
*Figure 54: The Roles page listing all user roles with their descriptions and assigned employee counts.*

![Add Role — Create a new user role with name and description](/docs/roles-add.png)
*Figure 55: Adding a new role to the system with a name, description, and initial configuration.*

![Role Permissions — Assign granular permissions to a specific role](/docs/roles-permissions.png)
*Figure 56: The Permissions editor where administrators toggle individual access controls for each role.*

---

## 11. System & Settings Modules

### 11.1 Reports & Ledger
**Who can see this:** Admin (or anyone with "View Reports" permission)

- Generate financial reports: Profit & Loss, Revenue, Sales.
- View the general ledger and account balances.
- Export reports for accounting purposes.

![Reports & Ledger — Generate financial reports and view the general ledger](/docs/reports-ledger.png)
*Figure 57: The Reports & Ledger page showing financial reports, account balances, and export options.*

### 11.2 Audit Logs
**Who can see this:** Admin (or anyone with "View Audit Logs" permission)

- Track all system activity: who did what and when.
- View login/logout events, data changes, and access attempts.
- Filter by user, action type, module, or date range.

![Audit Logs — Track all system activity including user actions and access events](/docs/audit-logs.png)
*Figure 58: The Audit Logs page showing a filterable record of all system activity by user, action, and date.*

### 11.3 Settings
**Who can see this:** Admin only (or anyone with "System Settings" permission)

- **General:** Business name, logo, branding.
- **Receipts:** Customize receipt templates and content.
- **Theme:** Configure system appearance.
- **Security:** Manage authentication and access settings.
- **Navbar Ads:** Customize the website announcement bar messages.
- **Newsletter:** Configure the pop-up newsletter modal.

![Dashboard Settings — Configure dashboard display preferences and widget options](/docs/dashboard-setting.png)
*Figure 59: The Settings page where administrators can customize dashboard display, branding, and system configuration.*

---

## 12. E-Commerce Website

The public-facing website allows customers to browse and order products online.

### Pages:
- **Home:** Featured products, testimonials, and promotions.
- **Shop:** Full product catalog with search and filters.
- **Product Detail:** Detailed product page with images, description, and pricing.
- **Cart:** Review items before checkout.
- **Checkout:** Complete the purchase with M-Pesa payment.
- **About:** Company story and information.
- **Contact:** Phone numbers, email addresses, and operating hours.

### Checkout Process (Customer View):
1. Browse products and add to cart.
2. Go to checkout.
3. Enter contact email and shipping/pickup details.
4. Pay via **M-Pesa** (STK push to phone).
5. Enter a valid Kenyan phone number (e.g. 0712 345 678 or +254712345678).
6. Enter M-Pesa PIN to confirm payment.
7. Order is confirmed and tracked.

### Delivery Policy:
- **Free delivery** on orders over KES 2,000.
- **KES 200** delivery fee for orders under KES 2,000.
- Delivery to Nairobi and surrounding areas.

---

## 13. Roles & Permissions Guide

This section is for Administrators who manage employee access.

### Understanding Permissions

Permissions are granular controls that determine what a user can see and do. They are grouped into categories:

| Permission Name | What It Controls |
|---|---|
| **View Dashboard** | Access to the main dashboard with KPIs and metrics |
| **Access POS** | Use the Point of Sale system for in-store sales |
| **Manage Orders** | Create and manage customer orders, view order tracking |
| **Manage Customers** | View and edit customer profiles and data |
| **Manage Deliveries** | Schedule deliveries, assign riders, track orders |
| **Manage Pricing** | Set retail and wholesale pricing tiers |
| **Manage Inventory** | Track stock, reorders, purchasing, suppliers, distributors, assets |
| **Manage Purchases** | Create purchase orders and manage suppliers |
| **Manage Recipes** | Define recipes, production runs, picking lists, lot tracking, waste control |
| **Manage Employees** | Staff profiles, payroll, certificates, productivity |
| **View Reports** | Financial reports, P&L, employee productivity |
| **Manage Finance** | Expenses, debtors, and creditors management |
| **Manage Outlets** | Full branch management (all outlet modules) |
| **View Outlets** | Read-only access to outlet data |
| **Manage Outlet Inventory** | Branch-specific inventory management |
| **Manage Requisitions** | Create and manage product requests from branches |
| **Approve Requisitions** | Approve or reject branch product requests |
| **System Settings** | System configuration, roles & permissions, audit logs |
| **View Audit Logs** | View system activity and access logs |

### How to Create a New Role:
1. Go to **Roles & Permissions** in the sidebar.
2. Click **Add Role**.
3. Enter a role name and description (e.g., "Branch Manager").
4. Select the permissions this role should have.
5. Save the role.

### How to Assign a Role to an Employee:
1. Go to **Employees** module.
2. Find and edit the employee record.
3. Set the **Login Role** to the desired role (e.g., Baker, Cashier, Sales).
4. Ensure **System Access** is enabled.
5. Save the changes.

### Strictly Restricted Roles:
- **Rider** and **Driver** roles are strictly restricted. They can ONLY see:
  - Dashboard
  - Delivery
  - Order Tracking
  - Rider Reports
  - Account Settings
- No additional permissions can override this restriction.
- This restriction is enforced at both the server level (middleware) and client level (sidebar/route guard), so it cannot be bypassed.

### Role Hierarchy:
\`\`\`
Super Admin / Administrator
  └── Full access to everything

Outlet Admin / Branch Manager
  └── Base role permissions + all Outlet modules for their assigned branch

Sales
  └── Orders, Customers, Delivery, Pricing

Cashier / POS Attendant
  └── POS, Orders, Customers

Baker
  └── All Production modules (Recipes, Production, Picking Lists, etc.)

Rider / Driver
  └── Delivery, Order Tracking, Rider Reports only (strictly enforced)

Viewer
  └── Account Settings only; additional modules granted via permissions

Custom Roles
  └── Any combination of permissions as configured
\`\`\`

---

## 14. Troubleshooting

### I can't see a module in the sidebar
- Your role may not have permission to access that module.
- Contact your administrator to check your permissions.
- Make sure your **System Access** is enabled.

### I can't log in
- Verify your email address is correct.
- Check that your account has been created by an administrator.
- Your **System Access** must be enabled.
- Try resetting your password through your administrator.

### The system is loading slowly
- Check your internet connection.
- Try refreshing the page (Ctrl+R or Cmd+R).
- Clear your browser cache if issues persist.
- Try the installed app version for better performance.

### Online order alarm won't stop
- Click the **STOP ALARM** button in the header.
- Or click **Acknowledge** on each order notification.
- You can also mute the alarm using the speaker icon.

### M-Pesa payment timed out (for customers)
- Wait 30 seconds and try again.
- Make sure your phone has network connectivity.
- Check that the M-Pesa phone number is correct.
- Use the "Verify Payment" option if you already paid manually.

### I'm seeing an "Access Denied" or redirect
- You are trying to access a module outside your role's permissions.
- The system enforces restrictions at both the server and browser level.
- Riders and Drivers are strictly limited and will be redirected automatically.
- Contact your administrator if you need additional access.

### I'm seeing "System access is disabled"
- Your administrator has disabled your system access.
- Contact your manager or administrator to re-enable it.

---

## Quick Reference Card

| I need to... | Go to... |
|---|---|
| Process an in-store sale | POS System |
| View today's orders | Orders |
| Check ingredient stock | Inventory |
| Start a production batch | Production Runs |
| See my delivery assignments | Delivery |
| Report damaged goods | Rider Reports |
| Request products for my branch | Outlet Requisitions |
| Record an expense | Expenses |
| Check a customer's debt | Debtors |
| See who did what | Audit Logs |
| Change my password | Account Settings |
| Add a new employee | Employees |
| Create a new role | Roles & Permissions |

---

## Contact & Support

- **Online Orders:** 0733 67 52 67 | sales@snackoh-bakers.com
- **Complaints & Compliments:** 0722 587 222 | 0799 55 94 34 | feedback@snackoh-bakers.com
- **Leadership:** ceo@snackoh-bakers.com

**Operating Hours:**
- Monday - Saturday: 6:00 AM - 8:00 PM
- Sunday: 7:00 AM - 6:00 PM

---

*Snackoh Bakers Management System v2.0*
*Last Updated: February 2026*
`;

export default function DocumentationPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  const scrollToTop = () => {
    const container = document.getElementById('doc-scroll-container');
    if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      id="doc-scroll-container"
      className="h-full overflow-auto"
      onScroll={handleScroll}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-700">
              <BookOpenText size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Employee Training Manual</h1>
              <p className="text-sm text-muted-foreground">Complete system documentation for all modules</p>
            </div>
          </div>
          <a
            href="/admin/documentation"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Open documentation in a new tab"
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Open in New Tab</span>
          </a>
        </div>

        {/* Markdown content */}
        <article className="documentation-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold text-foreground mt-8 mb-4 pb-2 border-b border-border">
                  {children}
                </h1>
              ),
              h2: ({ children, ...props }) => {
                const id = typeof children === 'string'
                  ? children.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                  : undefined;
                return (
                  <h2 id={id} className="text-2xl font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border scroll-mt-4">
                    {children}
                  </h2>
                );
              },
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold text-foreground mt-8 mb-3">{children}</h3>
              ),
              h4: ({ children }) => (
                <h4 className="text-lg font-semibold text-foreground mt-6 mb-2">{children}</h4>
              ),
              p: ({ children, node }) => {
                const hasImg = node?.children?.some((child: any) => child.tagName === 'img');
                if (hasImg) {
                  return <div className="my-4">{children}</div>;
                }
                return <p className="text-base text-foreground leading-7 mb-4">{children}</p>;
              },
              em: ({ children }) => {
                const text = typeof children === 'string' ? children : '';
                if (text.startsWith('Figure ')) {
                  return (
                    <em className="block text-sm text-muted-foreground italic mt-2 mb-6 text-center">
                      {children}
                    </em>
                  );
                }
                return <em className="italic">{children}</em>;
              },
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  {children}
                </a>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 mb-4 space-y-1.5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 mb-4 space-y-1.5">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="text-base text-foreground leading-7">{children}</li>
              ),
              hr: () => <hr className="my-8 border-border" />,
              code: ({ className, children }) => {
                const isBlock = className?.includes('language-');
                if (isBlock) {
                  return (
                    <code className="block bg-secondary rounded-lg p-4 text-sm font-mono text-foreground overflow-x-auto whitespace-pre my-4">
                      {children}
                    </code>
                  );
                }
                return (
                  <code className="bg-secondary px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre className="bg-secondary rounded-lg p-4 overflow-x-auto my-4">
                  {children}
                </pre>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-6 rounded-lg border border-border">
                  <table className="w-full text-sm">{children}</table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-secondary">{children}</thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-border">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-secondary/50 transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-4 py-3 text-left font-semibold text-foreground">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-3 text-foreground">{children}</td>
              ),
              img: ({ src, alt }) => (
                <figure className="my-6">
                  <div className="rounded-lg overflow-hidden border border-border shadow-sm">
                    <img
                      src={src}
                      alt={alt || ''}
                      loading="lazy"
                      className="w-full h-auto block"
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                  {alt && (
                    <figcaption className="text-xs text-muted-foreground mt-2 text-center px-2">
                      {alt}
                    </figcaption>
                  )}
                </figure>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-orange-400 pl-4 py-1 my-4 bg-orange-50/50 rounded-r-lg">
                  {children}
                </blockquote>
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Snackoh Bakers Management System v2.0 &mdash; Employee Training Manual</p>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:opacity-90 transition-all z-50"
          title="Scroll to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}
