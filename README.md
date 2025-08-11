# Task Tenant: Multi-Tenant SaaS Platform

## Project Overview

Task Tenant is a multi-tenant SaaS (Software as a Service) platform designed to provide a robust and scalable solution for managing tasks and subscriptions. It features a Django-based backend with a multi-tenant architecture using `django-tenants`, a React frontend for a dynamic user experience, and Stripe integration for handling subscription payments. The platform allows for the creation of isolated workspaces (tenants) for different companies or teams, each with its own data schema.

## Features

### Backend Features

*   **Multi-Tenancy**: Utilizes `django-tenants` to provide isolated schemas for each tenant, ensuring data separation and security.
*   **User Authentication & Authorization**: Custom user model with email-based authentication, JWT (JSON Web Tokens) for secure API access, and user profile management.
*   **Tenant Management**: API endpoints for creating new tenants (workspaces) with associated users and domains.
*   **Subscription Management**: Defines subscription plans (Free, Pro, Enterprise) and manages user subscriptions to these plans.
*   **Payment Integration**: Seamless integration with Stripe for handling checkout sessions and webhook events for subscription payments.
*   **Admin Interface**: Enhanced Django Admin with `django-jazzmin` for a modern and user-friendly administrative panel.
*   **API Documentation**: Auto-generated API documentation using `drf-yasg` (Swagger/OpenAPI).
*   **Dummy Data Generation**: Script to populate the database with sample tenants, users, and subscriptions for development and testing.

### Frontend Features

*   **User Authentication**: Login and registration forms for users.
*   **Tenant Creation**: Interface for new users to create their own multi-tenant workspace.
*   **Dashboard**: Personalized user dashboard displaying profile information and subscription details.
*   **Subscription Plans**: Displays available subscription plans with pricing.
*   **Stripe Checkout Integration**: Redirects users to Stripe Checkout for secure payment processing.
*   **Protected Routes**: Ensures that certain parts of the application are only accessible to authenticated users.
*   **State Management**: Uses Zustand for efficient and persistent state management, particularly for authentication tokens.
*   **Responsive UI**: Built with React-Bootstrap for a responsive and modern user interface.

## Tech Stack

### Backend

*   **Framework**: Django 5.x
*   **API**: Django REST Framework
*   **Database**: PostgreSQL (via `django-tenants.postgresql_backend`)
*   **Multi-Tenancy**: `django-tenants`
*   **Authentication**: `djangorestframework-simplejwt`
*   **Admin Theme**: `django-jazzmin`
*   **API Documentation**: `drf-yasg` (Swagger/OpenAPI)
*   **Payment Gateway**: Stripe
*   **Environment Variables**: `python-dotenv`
*   **CORS**: `django-cors-headers`
*   **Asynchronous Tasks**: Celery (though commented out in `accounts/views.py`, dependencies are present)
*   **Database Driver**: `psycopg2`
*   **Other**: `Pillow`, `Faker`, `requests`, `pyyaml`, `redis`

### Frontend

*   **Framework**: React 19.x
*   **Build Tool**: Vite 7.x
*   **State Management**: Zustand (with `zustand/middleware` for persistence)
*   **Routing**: `react-router-dom` 7.x
*   **UI Library**: React-Bootstrap, Bootstrap 5.x
*   **Form Handling**: `react-hook-form` with `zod` for validation
*   **HTTP Client**: Axios
*   **Payment Integration**: `@stripe/stripe-js`
*   **Styling**: PostCSS, TailwindCSS (dev dependency, but not explicitly used in provided code)
*   **Linting**: ESLint

## Installation Instructions

Follow these steps to set up the project locally.

### Prerequisites

*   Docker and Docker Compose
*   Node.js (v20 or higher) and npm (or yarn)
*   Python (v3.11) and pip (for local development outside Docker, if preferred)

### 1. Clone the Repository

```bash
git clone <[repository_url](https://github.com/Mohamed-Taha-Essa/task_tennant_auth_payment.git)>
cd task_tenant/src
```

### 2. Environment Variables

Create a `.env` file in the `src/` directory (same level as `docker-compose.yaml`) and populate it with the following variables:

```env
# PostgreSQL Database
POSTGRES_HOST=postgres
POSTGRES_DB=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Stripe API Keys (replace with your actual keys)
STRIPE_PUBLIC_KEY=pk_test_YOUR_STRIPE_PUBLIC_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET

# Frontend URL (for Stripe redirects)
SITE_URL=http://localhost:5173
```

**Note**: For `STRIPE_WEBHOOK_SECRET`, you'll need to set up a Stripe webhook endpoint and get the signing secret. During local development, you can use the Stripe CLI (`stripe listen --forward-to localhost:8000/api/payment/webhook/`) to get a test secret.

### 3. Build and Run with Docker Compose

Navigate to the `src/` directory (where `docker-compose.yaml` is located) and run:

```bash
docker-compose up --build -d
```

This command will:
*   Build the Docker images for both backend and frontend.
*   Start the PostgreSQL database, backend, and frontend services.

### 4. Apply Backend Migrations

Once the backend service is running, apply the database migrations:

```bash
docker-compose exec backend python manage.py migrate_schemas --shared
docker-compose exec backend python manage.py migrate_schemas --tenant
```

### 5. Create a Superuser (for Django Admin)

```bash
docker-compose exec backend python manage.py createsuperuser
```
Follow the prompts to create an admin user.

### 6. (Optional) Populate Dummy Data

To add some sample plans and tenants:

```bash
docker-compose exec backend python dummy_data.py
```

### 7. Access the Applications

*   **Frontend**: Open your browser and go to `http://localhost:5173`
*   **Backend API**: The API will be accessible at `http://localhost:8000`
*   **Django Admin**: Access the admin panel at `http://localhost:8000/admin/`

## Environment Variables

The following environment variables are used in the project:

| Variable              | Description                                                              | Used In          |
| :-------------------- | :----------------------------------------------------------------------- | :--------------- |
| `POSTGRES_HOST`       | Hostname for the PostgreSQL database.                                    | `backend/.env`   |
| `POSTGRES_DB`         | Database name for PostgreSQL.                                            | `backend/.env`   |
| `POSTGRES_USER`       | Username for PostgreSQL.                                                 | `backend/.env`   |
| `POSTGRES_PASSWORD`   | Password for PostgreSQL.                                                 | `backend/.env`   |
| `STRIPE_PUBLIC_KEY`   | Your Stripe Publishable Key (starts with `pk_test_`).                   | `backend/.env`, `frontend/.env` (via Vite) |
| `STRIPE_SECRET_KEY`   | Your Stripe Secret Key (starts with `sk_test_`).                         | `backend/.env`   |
| `STRIPE_WEBHOOK_SECRET` | Secret for verifying Stripe webhook signatures (starts with `whsec_`). | `backend/.env`   |
| `SITE_URL`            | The base URL of your frontend application. Used for Stripe redirects.    | `backend/.env`   |

## API Documentation

The backend API is documented using Swagger UI, accessible at:

`http://localhost:8000/swagger/`

Key API Endpoints:

*   **Authentication**:
    *   `POST /api/accounts/signup/`: Register a new user.
    *   `POST /api/accounts/tenant-signup/`: Register a new user and create a new tenant.
    *   `POST /api/accounts/login/`: User login (returns JWT tokens).
    *   `POST /api/token/refresh/`: Refresh JWT access token.
    *   `POST /api/accounts/logout/`: User logout (blacklists refresh token).
    *   `GET /api/accounts/profile/`: Get authenticated user's profile.
    *   `PUT /api/accounts/profile/edit-profile/`: Update authenticated user's profile.
    *   `PUT /api/accounts/change-password/`: Change user's password.
    *   `POST /api/accounts/resend-activation/`: Resend activation email.
    *   `POST /api/accounts/reset-password/`: Request password reset email.

*   **Subscription & Plans**:
    *   `GET /subscriptions/api/plans/`: List all available subscription plans.
    *   `GET /subscriptions/api/subscription/`: Get authenticated user's subscription details.

*   **Payment (Stripe)**:
    *   `POST /api/payment/create-checkout-session/`: Create a Stripe checkout session for a plan.
    *   `POST /api/payment/webhook/`: Stripe webhook endpoint for processing payment events.

## Frontend Usage

The frontend is a React application built with Vite.

### Running Locally (without Docker)

If you prefer to run the frontend outside of Docker (e.g., for faster development cycles):

1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
    The frontend will typically run on `http://localhost:5173`.

### Connecting to Backend

The frontend automatically connects to the backend running on `http://localhost:8000` using `window.location.protocol` and `window.location.hostname` for dynamic API URL construction. Ensure your backend is running and accessible.

## Deployment Instructions

This project is set up for Dockerized deployment, making it portable across various environments.

### General Steps for Production Deployment

1.  **Environment Variables**: Ensure all `.env` variables are properly configured for your production environment (e.g., actual domain names, production Stripe keys).
2.  **Database**: Use a managed PostgreSQL service for production. Update `POSTGRES_HOST` and other database credentials accordingly.
3.  **Static Files**: For Django, configure a production-ready static files serving solution (e.g., Nginx, S3).
4.  **HTTPS**: Always use HTTPS in production. Configure your web server (e.g., Nginx) to handle SSL termination.
5.  **Docker Compose**: For simple deployments, `docker-compose up -d` can be used on a server. For more complex setups, consider Kubernetes or other container orchestration platforms.
6.  **Stripe Webhooks**: Ensure your production Stripe webhook endpoint is publicly accessible and correctly configured in the Stripe Dashboard.

## Folder Structure

```
.
├── .gitignore
├── docker-compose.yaml
├── README.md
├── requirements.txt
├── backend/
│   ├── .gitignore
│   ├── Dockerfile
│   ├── dummy_data.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── a_tenant_manager/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── accounts/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── payment/
│   │   ├── __init__.py
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── models.py
│   │   ├── urls.py
│   │   ├── views.py
│   │   └── migrations/
│   ├── project/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── subscriptions/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
└── frontend/
    ├── .gitignore
    ├── Dockerfile
    ├── package-lock.json
    ├── package.json
    ├── vite.config.js
    ├── public/
    └── src/
        ├── App.css
        ├── App.jsx
        ├── index.css
        ├── main.jsx
        ├── api/
        │   ├── auth.js
        │   ├── payment.js
        │   ├── tenant.js
        │   └── user.js
        ├── assets/
        ├── components/
        │   ├── Dashboard.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── plans.jsx
        │   ├── auth/
        │   │   ├── CreateTenant.jsx
        │   │   ├── Login.jsx
        │   │   └── SignUp.jsx
        │   ├── payment/
        │   │   ├── Cancel.jsx
        │   │   ├── Payment.jsx
        │   │   └── Success.jsx
        │   └── ui/
        │       └── navbar.jsx
        └── store/
            └── authStore.js
