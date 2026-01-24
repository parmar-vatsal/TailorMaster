# TailorMaster

**TailorMaster** is a comprehensive Customer Relationship Management (CRM) and Order Management System designed specifically for professional tailoring businesses. It streamlines the entire tailoring workflow—from customer onboarding and detailed measurements to order tracking and expense management.

## Key Features

### 🧵 Customer Management
- **Digital Profiles**: Store complete customer details including contact info and address.
- **Connect & Call**: Integrated call buttons and quick actions for seamless communication.

### 📏 Measurement Tracking
- **Garment-Specific**: Record specialized measurements for Shirts, Pants, Suits, and more.
- **History**: Maintain a history of measurements to ensure perfect fits over time.

### 📝 Order Management
- **Lifecycle Tracking**: Track orders from 'Received' to 'Delivered'.
- **Financials**: Manage total amounts, advance payments, and pending dues.
- **Invoicing**: Generate and track invoices (architecture ready).

### 🎨 Design Catalog
- **Visual Library**: Upload and organize design reference images for customers.
- **Categories**: Tag designs for easy retrieval (e.g., Kurta, Formal, Casual).

### 💰 Expense Tracker
- **Shop Management**: Log shop expenses (materials, rent, utilities) to keep track of profitability.

### 🔒 Secure & Private
- **Authentication**: Secure login via generic email/password or Magic Links.
- **Data Isolation**: Row Level Security (RLS) ensures shop owners only see their own data.
- **Local Settings**: Customize shop profile and security PIN.

## Technology Stack

- **Frontend**: React (Vite) + TypeScript
- **Styling**: Tailwind CSS for a modern, responsive UI
- **Backend & Database**: Supabase (PostgreSQL)
- **Security**: Row Level Security (RLS) policies enforcing strict data access controls
- **Routing**: React Router v6

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/parmar-vatsal/TailorMaster.git
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file with your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```
4.  **Run Locally**:
    ```bash
    npm run dev
    ```

## License

Private / Proprietary.
