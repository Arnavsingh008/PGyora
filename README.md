# PGyora

PGyora is a full-stack PG and co-living management platform for students and young professionals. Users can discover available rooms, compare facilities, submit booking requests, and track complaints from one interface. The frontend is designed as a dynamic accommodation discovery experience rather than a static CRUD dashboard.

This repository is prepared for local development and future deployment. It does not include production credentials, live deployment URLs, or external image storage.

## Deploy to Render

The root `render.yaml` defines two Render services:

- `pgyora-api`: Django/Gunicorn API backed by MongoDB Atlas
- `pgyora-web`: Vite static frontend

### 1. Prepare MongoDB Atlas

In MongoDB Atlas, create a database user, allow the Render outbound IP range (or temporarily allow `0.0.0.0/0` while testing), and copy the SRV connection string. Replace the password placeholder and URL-encode special password characters such as `@`, `:`, `/`, and `#`.

Do not commit the connection string. In Render, set the backend `MONGODB_URI` environment variable to:

```text
mongodb+srv://USERNAME:PASSWORD@cluster0.ovtsvft.mongodb.net/
```

The database name is supplied separately as `DB_NAME=pgyora`.

### 2. Create the Render services

In Render, choose **New > Blueprint**, connect the repository, and select the root `render.yaml`. The Blueprint generates a production secret and asks for the sensitive `MONGODB_URI` value. Deploy `pgyora-api` and `pgyora-web` together.

If you rename either service or attach a custom domain, update `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and `VITE_API_BASE_URL` in the Render environment settings to match the final public URLs. `VITE_API_BASE_URL` is a frontend build-time variable, so redeploy the static site after changing it.

### 3. Local and production environment files

Local development continues to use `backend/.env.local` and `frontend/.env.development`. Production examples are available in `backend/.env.production.example` and `frontend/.env.production.example`. Django selects `.env.production` only when `DJANGO_ENV=production`; Render supplies these values as environment variables, so no production secret file is required in the repository.

## Features

- Dynamic responsive React landing page with animated discovery sections
- Real-time homepage metrics for open rooms, beds, prices, and locations
- Dynamic room-type and location exploration generated from API data
- Scroll-reveal animations, hover interactions, reduced-motion support, and loading states
- Student registration, login, logout, and editable profile
- Django session authentication with CSRF protection
- Separate student and Django Admin session cookies
- MongoDB-backed property and room listings
- Location, budget, and sharing-type filters
- Rule-based Smart Room Finder with match percentages
- Guided four-step Smart Finder with transparent match reasons
- Room details with facilities and live availability
- Explore filtering by facilities, price, sharing type, and available beds
- Explore sorting by price low-to-high, high-to-low, or available beds
- Booking requests, cancellation, approval, and rejection
- Full rooms hidden from public listings
- Capacity-safe reservations that prevent room overbooking
- Complaint submission and complaint status tracking
- Contact and support page with email-client handoff and dashboard shortcut
- Dashboard quick actions, booking dates, and pending-request statistics
- Django Admin management for users, properties, rooms, bookings, and complaints
- Django-rendered examples for templates, forms, CSRF, and POST-redirect-GET

## Technology stack

- **Frontend:** React 18, Vite, Axios, Bootstrap, Lucide React
- **Backend:** Django 5.2, Django REST Framework
- **Database:** MongoDB through the official `django-mongodb-backend`
- **Authentication:** Django sessions; no JWT
- **Runtime:** Python 3.12 and Node.js 20+

## Project structure

```text
PGyora/
├── backend/
│   ├── accounts/
│   ├── bookings/
│   ├── properties/
│   ├── pgyora/
│   ├── templates/
│   ├── .env.example
│   ├── manage.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.12
- Node.js 20 or later
- MongoDB Community Server, or a MongoDB Atlas cluster
- Git

MongoDB Compass is optional. It is a GUI client, not the database server.

## Setup on Windows

### Clone the repository

```cmd
git clone <your-github-repository-url>
cd PGyora
```

### Configure the backend

```cmd
cd backend
py -3.12 -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env.local
```

Edit `backend\.env.local`:

```env
DJANGO_ENV=local
DEBUG=True
SECRET_KEY=replace-this-for-local-development
ALLOWED_HOSTS=127.0.0.1,localhost
MONGODB_URI=mongodb://localhost:27017/
DB_NAME=pgyora
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
SESSION_COOKIE_NAME=student_sessionid
ADMIN_SESSION_COOKIE_NAME=admin_sessionid
```

Never commit `.env.local` or real credentials.

### Prepare the database

Make sure MongoDB is running:

```cmd
python manage.py check
python manage.py migrate
python manage.py createsuperuser
```

The project uses MongoDB ObjectIds through `django-mongodb-backend`. Do not replace it with SQLite, PostgreSQL, or Djongo.

### Configure the frontend

Open a second terminal:

```cmd
cd frontend
npm install
copy .env.example .env.development
npm run dev
```

Frontend: <http://localhost:5173/>  
Backend: <http://localhost:8000/>  
Django Admin: <http://localhost:8000/admin/>

## Authentication and sessions

Student authentication uses the React API and the `student_sessionid` cookie. Django Admin uses the separate `admin_sessionid` cookie, so logging in as an admin does not replace a student session in the same browser.

Students sign in through the React application. Admin users sign in through:

```text
http://localhost:8000/admin/
```

The frontend sends cookies with Axios and obtains a CSRF cookie before protected write requests.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/accounts/csrf/` | Set the CSRF cookie |
| POST | `/api/accounts/register/` | Register a student |
| POST | `/api/accounts/login/` | Log in a student |
| POST | `/api/accounts/logout/` | Log out |
| GET/PATCH | `/api/accounts/profile/` | Read or update the student profile |
| GET | `/api/properties/` | List active properties |
| GET | `/api/rooms/` | List available rooms with location, price, sharing, facility, and sort filters |
| POST | `/api/rooms/find/` | Get rule-based recommendations |
| GET/POST | `/api/bookings/` | List or create booking requests |
| POST | `/api/bookings/<id>/cancel/` | Cancel an owned booking |
| POST | `/api/bookings/<id>/approve/` | Admin approval |
| POST | `/api/bookings/<id>/reject/` | Admin rejection |
| GET/POST | `/api/complaints/` | List or create complaints |
| PATCH | `/api/complaints/<id>/` | Admin complaint status update |

ObjectIds are converted to strings in API responses before they reach React.

### Room listing query parameters

The room listing endpoint supports combined filters:

```text
/api/rooms/?location=Phagwara&max_price=8000&room_type=double&facilities=WiFi,AC&sort=price_asc
```

Supported `sort` values are `price_asc`, `price_desc`, and `availability`.

## Django syllabus coverage

- **Unit 1:** `manage.py`, `pgyora/`, Django apps, and requirements
- **Unit 2:** API views, URL routing, URL parameters, JSON responses, and error handling
- **Unit 3:** `backend/templates/base.html`, room detail template, template inheritance, loops, and conditionals
- **Unit 4:** `DjangoComplaintForm`, POST handling, validation, CSRF, messages, and redirect after submission
- **Unit 5:** MongoDB-backed models, migrations, relationships, Django Admin, users, and permissions
- **Unit 6:** login, logout, sessions, cookies, CSRF, and authentication middleware

## Validation

Backend:

```cmd
cd backend
venv\Scripts\python.exe manage.py check
```

Frontend:

```cmd
cd frontend
npm run build
```

The repository includes Django model, capacity, filtering, and Smart Finder regression tests:

```cmd
cd backend
venv\Scripts\python.exe manage.py test
```

Full workflow testing should be performed with MongoDB running and test data available.

## Known limitations

- The Contact form prepares a message in the visitor's default email client; it does not store messages in MongoDB.
- Smart Finder recommendations are transparent rule-based matches, not machine-learning predictions.
- Room records currently support one property image URL; missing or failed images use an accessible fallback.
- Wishlist, room comparison, payments, ratings, and reviews are not enabled because they are not required by the current data model.

## GitHub and security checklist

- Keep `.env.local`, `.env.production`, credentials, virtual environments, `node_modules`, build output, and logs out of Git.
- Commit `.env.example` files only.
- Replace the development `SECRET_KEY` before deployment.
- Store MongoDB Atlas credentials in the hosting provider's secret manager.
- Set `DEBUG=False` in production.
- Configure production `ALLOWED_HOSTS`, CORS, CSRF trusted origins, HTTPS, and secure cookies.
- Use backups, monitoring, rate limiting, and stronger concurrency controls before public production use.
- Do not commit uploaded media or private user data.

## Deployment notes

The project is structured for future deployment but is not tied to a specific hosting provider. Deployment requires a Django-compatible Python host, a reachable MongoDB Atlas cluster, environment variables, HTTPS, static-file handling, and a separately hosted frontend.
