# Duo.Lab Calc – 3D Printing Calculator

A complete pricing and production management solution developed for **Duo.Lab**, focused on 3D printing cost estimation, production variables, commercial pricing, customer quotation support and order workflow management.

The project transforms the pricing and production process for 3D printed products into a practical digital tool, helping calculate material usage, print time, quantity, accessories, packaging, fees, profit margin and final sale price while also providing a visual Kanban planner for managing orders from modeling to delivery.

---

## 🖥 Live Version

🔗 https://duolabcalc.vercel.app/

---

## 📌 About This Project

This project was designed as a **complete pricing and production management tool for 3D printing services**, covering:

- Filament selection and material cost calculation
- Piece weight, print time and quantity inputs
- Material loss and production margin
- Energy, infrastructure and depreciation costs
- Accessories and finishing options
- Packaging options
- Marketplace and sales channel fees
- Profit margin calculation
- Internal cost breakdown
- Customer-facing quote summary
- Production order management
- Kanban-based workflow
- Shared planner synchronization
- Order status tracking
- Payment and delivery tracking
- WhatsApp production list export

It follows a lightweight technical structure:

- Pure **HTML**, **CSS**, and **JavaScript**
- No front-end frameworks
- Clean and modular code
- Fully responsive
- Dynamic calculation logic based on user inputs
- LocalStorage support
- Firebase / Firestore integration for shared planner data
- Vercel deployment

---

## 🧱 Project Structure

The Duo.Lab Calc project includes:

### 🧮 **Pricing Calculator**
- Input fields for material, weight, time and quantity
- Real-time recalculation
- Automatic total and unit price update
- Clear separation between production cost and sale price
- Fast initialization without waiting for non-critical page resources
- Reset option to restore calculator default values

### 🧵 **Filament Selection**
- Predefined filament options
- Material cost per kilogram
- Color and material reference
- Automatic update of material cost based on selected filament
- Visual color indicator
- Centralized filament configuration

### ⚙️ **Production Cost Logic**
- Material usage calculation
- Material loss percentage
- Print time calculation
- Energy consumption cost
- Infrastructure cost
- Printer depreciation
- Computer depreciation
- Finishing cost
- Quantity-based cost scaling
- Optional production costs controlled by checkboxes

### 📦 **Accessories & Packaging**
- Keychain option
- Magnet option
- LED lamp option
- Adhesive cost
- Plastic packaging
- Kraft bag option
- Finishing option
- Depreciation control
- Infrastructure control

### 🛒 **Sales Channel Fees**
- Marketplace percentage fees
- Shopee fixed fee support
- Direct sales option
- Final price adjusted by commercial channel
- Unit and total sale price calculation

### 📊 **Internal Breakdown**
- Material cost
- Energy and infrastructure cost
- Hardware depreciation
- Finishing cost
- Accessories
- Packaging
- Sales channel fees
- Production cost total
- Suggested unit price
- Final quotation value

### 📄 **Customer Quote**
- Simplified quote view
- Selected filament information
- Quantity
- Optional services
- Unit price
- Total price
- Date reference
- PDF / print support

### 📋 **Production Planner**
- Dedicated Kanban-style production board
- Order creation and editing
- Drag-and-drop workflow
- Production status management
- Customer information
- Product information
- Quantity control
- Filament / color reference
- Due date tracking
- Order value tracking
- Notes and production instructions
- Priority support
- Search and filtering tools

### 🔄 **Kanban Workflow**
The production planner supports multiple workflow stages, including:

- Modeling
- Ready to Produce
- In Production
- Backlog
- Completed / Awaiting Payment
- Paid / Delivered

Orders can be moved between stages according to their current production status.

### 🧩 **Customizable Planner Boards**
- Reorder Kanban columns
- Hide individual boards
- Restore board visibility
- Preserve complete board content when repositioning
- Save board layout preferences locally
- Internal scrolling for boards with larger numbers of orders
- Compact layout designed to keep the production overview visible

### ☁️ **Shared Planner Data**
- Firebase / Firestore integration
- Shared production order storage
- Real-time synchronization
- Cross-device planner updates
- Local fallback support
- Persistent production workflow

### 📱 **WhatsApp Export**
- Generate a formatted production list
- Export current planner information as text
- Group orders by production status
- Include customer and quantity information
- Include relevant production notes
- Include completed orders awaiting payment
- Include paid and delivered orders
- Copy generated text directly to the clipboard
- Format optimized for sharing through WhatsApp

---

## 🧩 Features

### ✔️ **Dynamic Calculation**
The calculator updates values automatically based on the selected options and entered production data.

### ✔️ **Fast Calculator Initialization**
The calculator initializes as soon as the page DOM is available, avoiding unnecessary dependency on images and other non-critical visual resources before the interface becomes functional.

### ✔️ **Reset Calculator**
A dedicated **Clear** button restores the calculator to its initial state, including default production options, quantity, time, weight, margin, filament and sales channel settings.

### ✔️ **Filament Cost Control**
The user can select predefined filament options and automatically apply the correct material cost.

### ✔️ **Quantity-Based Pricing**
The calculation scales costs and final price according to the number of pieces.

### ✔️ **Production Cost Breakdown**
The internal view helps understand how each variable impacts the final price.

### ✔️ **Accessories and Packaging**
Optional items can be included in the final calculation, making the quote more accurate.

### ✔️ **Marketplace Fee Handling**
The calculator considers sales channel fees and adjusts the final price accordingly.

### ✔️ **Profit Margin Application**
The final sale price includes the configured profit margin.

### ✔️ **Customer-Facing Summary**
The tool generates a simplified quote section that can be used to present the final value to the client.

### ✔️ **Production Kanban**
Orders can be visually managed across the complete production workflow.

### ✔️ **Drag & Drop Orders**
Production tickets can be moved between workflow stages using drag and drop.

### ✔️ **Customizable Boards**
Kanban columns can be reordered or hidden according to the user's preferred workflow.

### ✔️ **Scrollable Buckets**
Kanban columns use internal scrolling when the number of production tickets exceeds the visible board area.

### ✔️ **Real-Time Synchronization**
Planner information can be synchronized through Firebase / Firestore, allowing production data to remain available across devices.

### ✔️ **WhatsApp Workflow Export**
Planner orders can be converted into a structured text summary for quick production updates and operational communication.

### ✔️ **Search and Filters**
The planner includes search and filtering tools to quickly locate production orders and priorities.

### ✔️ **Payment Tracking**
Completed orders can remain visible while awaiting payment and later move to the paid / delivered stage.

### ✔️ **Responsive Navigation**
The application includes responsive navigation designed to work across desktop and smaller screen sizes.

### ✔️ **Responsive Layout**
The calculator and planner interfaces adapt to desktop, tablet and mobile resolutions.

### ✔️ **Consistent Visual Language**
The application uses organized cards, clean spacing, readable inputs, responsive components and a practical interface focused on usability.

---

## 🔧 Recent Updates & Fixes

### **Production Planner**
- Added Duo.Lab order planner
- Added Kanban-based production workflow
- Improved drag-and-drop behavior
- Added quick ticket creation
- Added shared planner data source
- Added Firebase / Firestore real-time synchronization
- Added customizable board layout
- Added board reordering
- Added option to hide and restore boards
- Added internal scrolling for Kanban buckets
- Improved planner formatting and mobile responsiveness
- Removed unnecessary decorative icons from board titles
- Added WhatsApp production list export
- Improved WhatsApp export workflow
- Added completed / awaiting payment information to the production workflow
- Added paid / delivered order tracking

### **Calculator**
- Updated filament configuration and costs
- Preserved predefined filament selection
- Added LED lamp accessory option
- Converted packaging options to checkbox controls
- Added plastic packaging checkbox
- Added Kraft bag checkbox
- Updated fixed plastic packaging cost
- Improved production cost calculation handling
- Improved zero-value calculation behavior
- Preserved depreciation and infrastructure as production cost components based on configured production data
- Improved calculator initialization performance
- Added calculator reset / clear functionality
- Preserved default calculator configuration after reset

### **Interface**
- Improved responsive behavior
- Added responsive hamburger navigation
- Improved floating navigation interface
- Standardized visual structure between calculator and planner
- Improved Kanban board usability
- Improved compact display for larger production queues
- Reduced unnecessary page initialization delay

---

## 📸 Demonstrations

### 🔹 Calculator Interface
Structured form with all main inputs required to calculate a 3D printing quote.

### 🔹 Filament Selection
Material selector with predefined costs, color reference and automatic value update.

### 🔹 Production Variables
Fields for weight, time, quantity and production-related costs.

### 🔹 Accessories & Packaging
Optional cost items that can be included in the final quote.

### 🔹 Internal Results
Detailed cost breakdown showing how the final value is composed.

### 🔹 Customer Quote
Simplified summary designed for client communication and PDF / print output.

### 🔹 Production Planner
Kanban interface for controlling active production orders.

### 🔹 Customizable Workflow
Production boards can be reordered, hidden and restored according to the current workflow.

### 🔹 WhatsApp Export
Production information can be transformed into formatted text for operational communication.

### 🔹 Responsive Design
Card-based structure that adapts across different screen sizes.

---

## 🛠 Technologies Used

- **HTML5** – semantic structure and form organization
- **CSS3** – responsive layout, visual hierarchy, cards and interface styling
- **JavaScript (ES6+)** – calculation engine, dynamic updates, planner logic and quote rendering
- **LocalStorage** – local persistence for settings, preferences and board layout
- **Firebase / Cloud Firestore** – shared planner data and real-time synchronization
- **Vercel** – deployment and hosting
- **Git / GitHub** – source control and project versioning

---

## 🚀 Main Application Areas

| Area | Purpose |
| --- | --- |
| Pricing Calculator | Calculate production costs and suggested sale prices |
| Cost Breakdown | Analyze material, infrastructure, depreciation and additional costs |
| Customer Quote | Generate a simplified commercial quotation |
| Production Planner | Manage orders through the production workflow |
| Kanban Boards | Organize production stages visually |
| WhatsApp Export | Share formatted production status information |
| Firestore Sync | Synchronize planner information across devices |

---

## 👤 Author

**André Luiz Ghiringhelli**  
Process Analyst | Full Stack Developer | RPA | Automation

<p align="left">
  <a href="mailto:ghiringhelli.andre@outlook.com" title="Outlook">
    <img src="https://img.shields.io/badge/-Outlook-0072C6?style=flat-square&labelColor=0072C6&logo=microsoftoutlook&logoColor=white" />
  </a>

  <a href="https://linkedin.com/in/ghiringhelli-andre" target="_blank" title="LinkedIn">
    <img src="https://img.shields.io/badge/-LinkedIn-0e76a8?style=flat-square&logo=linkedin&logoColor=white" />
  </a>

  <a href="https://wa.me/5512991354831" target="_blank" title="WhatsApp">
    <img src="https://img.shields.io/badge/-WhatsApp-25d366?style=flat-square&labelColor=25d366&logo=whatsapp&logoColor=white" />
  </a>
</p>