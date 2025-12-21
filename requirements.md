# JAIPUR Production Sheet Management System

## Original Problem Statement
Design a web-based software for the company "JAIPUR – A fine wood furniture company" that lets the team generate:
1. A4 multi-page PDF production sheets
2. PPT slides for the in-house production team

## Architecture & Features Implemented

### Backend (FastAPI + MongoDB)
- **Orders CRUD API**: Create, Read, Update, Delete orders with multiple line items
- **Order-level fields**: Sales Order Ref, Buyer PO Ref, Buyer Name, Entry Date, Status, Factory
- **Item-level fields**: Product Code, Description, Category, Size (H/D/W), CBM (auto-calc), Quantity, In-house production, Machine Hall, Leather Code, Finish Code, Color Notes, Wood Finish, Rich Text Notes, Multiple Images
- **Leather Library CRUD**: Manage leather codes with color and images
- **Finish Library CRUD**: Manage finish codes with color and images
- **Template Settings API**: Customize logo, colors, fonts, page layout
- **PDF Export**: Generate A4 production sheets using ReportLab
- **PPT Export**: Generate presentation slides using python-pptx
- **Dashboard Stats API**: Order counts by status, recent orders

### Frontend (React + Tailwind + Shadcn UI)
- **Dashboard**: Stats cards, recent orders, quick actions
- **Orders List**: Search, filter by status, CRUD operations
- **Create Order**: Multi-field form with date picker, dropdowns
- **Edit Order**: Full item editor with image upload, rich text notes
- **Order Detail**: View order info and line items table
- **PDF Preview**: Live preview of production sheet layout
- **Leather Library**: Grid view with CRUD operations
- **Finish Library**: Grid view with CRUD operations
- **Template Settings**: Customize branding, colors, fonts, layout

### Design System
- Typography: Playfair Display (headings), Manrope (body), JetBrains Mono (codes)
- Colors: Warm paper background, teak primary, burnt sienna accent
- Components: Shadcn UI with custom styling

## API Endpoints
- `GET/POST /api/orders` - List/Create orders
- `GET/PUT/DELETE /api/orders/{id}` - Order CRUD
- `GET /api/orders/{id}/export/pdf` - Download PDF
- `GET /api/orders/{id}/export/ppt` - Download PPT
- `GET /api/orders/{id}/preview-html` - Preview data
- `GET/POST/PUT/DELETE /api/leather-library` - Leather CRUD
- `GET/POST/PUT/DELETE /api/finish-library` - Finish CRUD
- `GET/PUT /api/template-settings` - Template config
- `GET /api/dashboard/stats` - Dashboard stats
- `GET /api/factories` - Factory list
- `GET /api/categories` - Category list

## Next Tasks (Phase 2)
1. **User Authentication**: Implement JWT-based auth with roles (Admin, Sales, Production, Viewer)
2. **Image Storage**: Move from Base64 to file storage or cloud storage
3. **Export History**: Show download history with version tracking
4. **Bulk Operations**: Import/export orders from CSV/Excel
5. **Advanced PDF**: Add product images in PDF, multiple images per item
6. **Workflow Automation**: Status change notifications, assignment to production
7. **Search & Filtering**: Advanced search across all fields
8. **Reports**: Generate production summaries, status reports
