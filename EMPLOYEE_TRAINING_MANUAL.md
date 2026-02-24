# Snackoh Bakers - Employee Training Manual

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
2. Click the **Staff Admin** icon (person icon) in the top-right of the website, or go directly to `/auth/login`.
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
- **Read-only** access. Very limited.
- Only modules explicitly granted via permissions.

### Custom Roles
Administrators can create custom roles (e.g., Branch Manager, Inventory Clerk) with specific permissions.

---

## 3. Dashboard

**Who can see this:** All roles (with "View Dashboard" permission)

The Dashboard provides a quick overview of the business:
- **Key Performance Indicators (KPIs):** Revenue, orders, customers, production metrics.
- **Recent Activity:** Latest orders, deliveries, and system events.
- **Quick Actions:** Shortcuts to common tasks.

---

## 4. POS System

**Who can see this:** Cashier, POS Attendant, Admin (or anyone with "Access POS" permission)

The Point of Sale module is used for in-store sales:
- **Process Sales:** Add products, set quantities, apply discounts.
- **Accept Payments:** M-Pesa, cash, and other payment methods.
- **Print Receipts:** Generate customer receipts.
- **Daily Transactions:** View sales history for the current shift.

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

### 5.2 Product Catalogue
- Manage allergen information for each product.
- Add nutritional facts and certifications.
- Mark halal, vegan, gluten-free, or other dietary labels.

### 5.3 Production Runs
- Schedule production batches for the day/week.
- Track batch status: Planned, In Progress, Completed.
- Record actual output vs. planned output.

### 5.4 Picking Lists
- Auto-generated ingredient lists for scheduled production runs.
- Used by bakers to gather ingredients before production.
- Helps ensure all materials are available.

### 5.5 Lot Tracking
- Track production batch numbers for traceability.
- Record expiry dates and shelf life.
- Trace any product back to its production batch if quality issues arise.

### 5.6 Waste Control
- Record and categorize production waste.
- Track waste by product type, cause (overproduction, damage, expiry).
- Analyze waste patterns to reduce losses.

---

## 6. Sales & Orders Modules

### 6.1 Customers
**Who can see this:** Sales, Cashier, Admin (or anyone with "Manage Customers" permission)

- View customer profiles, contact info, and order history.
- Segment customers by location, purchase frequency, etc.
- Track customer geo-location data for delivery planning.

### 6.2 Orders
**Who can see this:** Sales, Cashier, Admin (or anyone with "Manage Orders" permission)

- **Create Orders:** New orders for customers (walk-in, phone, or online).
- **Manage Orders:** Update status (Pending, Confirmed, In Production, Ready, Delivered).
- **Online Orders:** Review and confirm orders from the website (M-Pesa payments).

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

### 6.4 Delivery
**Who can see this:** Sales, Rider, Admin (or anyone with "Manage Deliveries" permission)

- Schedule deliveries and assign riders/drivers.
- View delivery routes and assignments.
- Track delivery completion and customer feedback.

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

---

## 7. Inventory Modules

**Who can see this:** Admin (or anyone with "Manage Inventory" permission)

### 7.1 Inventory
- Track raw materials, packaging, and finished goods stock levels.
- View stock alerts for low-quantity items.
- Record stock movements (received, used, adjusted).

### 7.2 Stock Reorder
- Manage stock requisitions and reorder alerts.
- Set minimum stock levels that trigger reorder notifications.
- Link production runs to ingredient availability.

### 7.3 Purchasing
- Create and manage purchase orders for suppliers.
- Track order status: Draft, Sent, Received, Paid.
- Compare quotes from different suppliers.

### 7.4 Suppliers
- Manage supplier profiles and contact information.
- Track supplier pricing and payment terms.
- Rate supplier reliability and quality.

### 7.5 Distributors
- Manage distribution agents and wholesale channels.
- Track distributor sales and commissions.
- Monitor distribution network performance.

### 7.6 Assets
- Track business equipment, vehicles, and tools.
- Record depreciation schedules.
- Manage maintenance and repair schedules.

---

## 8. Outlet (Branch) Modules

**Who can see this:** Admin (or anyone with "Manage Outlets" or "View Outlets" permission)

These modules are for managing multiple bakery locations:

### 8.1 Branch Management
- Create and manage branch outlets (e.g., CBD Branch, Westlands Branch).
- Set branch details: name, location, operating hours.
- Assign staff and managers to branches.

### 8.2 Outlet Inventory
- Track stock levels at each individual branch.
- Compare inventory across branches.
- Record stock movements between main bakery and branches.

### 8.3 Outlet Requisitions
- Branches can request products from the main bakery.
- Managers can approve or reject requisitions.
- Track requisition status: Pending, Approved, Dispatched, Received.

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

### 8.5 Outlet Products
- Manage the product catalog available at each branch.
- Set branch-specific pricing if needed.
- Control which products each branch can sell.

### 8.6 Branch Employees
- View and manage staff assigned to each branch.
- Track work schedules and attendance.
- Assign roles within the branch.

### 8.7 Branch Reports
- View sales, inventory, and performance reports per branch.
- Compare branch performance metrics.
- Identify top-performing and underperforming branches.

### 8.8 Branch Waste
- Record waste at each branch.
- Track waste by product type and cause.
- Compare waste across branches to identify issues.

### 8.9 Branch Settings
- Configure receipt templates, POS settings, and display options per branch.
- Customize branch-specific operating parameters.

---

## 9. Finance Modules

**Who can see this:** Admin (or anyone with "Manage Finance" permission)

### 9.1 Expenses
- Record and categorize business expenses.
- Attach receipts and supporting documents.
- Track expense approvals and payment status.

### 9.2 Debtors
- Track credit sales and customer debts.
- Send payment reminders.
- Record payments and maintain customer account balances.

### 9.3 Creditors
- Track amounts owed to suppliers.
- Manage payment schedules and due dates.
- Record payments made to suppliers.

---

## 10. People Management Modules

### 10.1 Employees
**Who can see this:** Admin (or anyone with "Manage Employees" permission)

- Manage staff profiles, emergency contacts, and personal details.
- Track certificates, licenses, and training records.
- Manage payroll information and salary details.
- Enable or disable system access for each employee.

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

### 10.3 Roles & Permissions
**Who can see this:** Admin only (or anyone with "System Settings" permission)

- Create and manage user roles.
- Assign granular permissions to each role.
- See the full guide in [Section 13](#13-roles--permissions-guide).

---

## 11. System & Settings Modules

### 11.1 Reports & Ledger
**Who can see this:** Admin (or anyone with "View Reports" permission)

- Generate financial reports: Profit & Loss, Revenue, Sales.
- View the general ledger and account balances.
- Export reports for accounting purposes.

### 11.2 Audit Logs
**Who can see this:** Admin (or anyone with "View Audit Logs" permission)

- Track all system activity: who did what and when.
- View login/logout events, data changes, and access attempts.
- Filter by user, action type, module, or date range.

### 11.3 Settings
**Who can see this:** Admin only (or anyone with "System Settings" permission)

- **General:** Business name, logo, branding.
- **Receipts:** Customize receipt templates and content.
- **Theme:** Configure system appearance.
- **Security:** Manage authentication and access settings.
- **Navbar Ads:** Customize the website announcement bar messages.
- **Newsletter:** Configure the pop-up newsletter modal.

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
5. Enter M-Pesa PIN to confirm payment.
6. Order is confirmed and tracked.

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

### Role Hierarchy:
```
Super Admin / Administrator
  └── Full access to everything

Sales
  └── Orders, Customers, Delivery, Pricing

Cashier / POS Attendant
  └── POS, Orders, Customers

Baker
  └── All Production modules (Recipes, Production, Picking Lists, etc.)

Rider / Driver
  └── Delivery, Order Tracking, Rider Reports only

Viewer
  └── Only explicitly granted permissions

Custom Roles
  └── Any combination of permissions as configured
```

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
- The system automatically redirects you to your allowed modules.
- Contact your administrator if you need additional access.

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
