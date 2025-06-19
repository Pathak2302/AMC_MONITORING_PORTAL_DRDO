# Database Setup Guide

## Option 1: Install PostgreSQL Locally

### On Windows:

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Install with default settings
3. Remember the password you set for the 'postgres' user

### On macOS:

```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database
createdb amc_portal
```

### On Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Switch to postgres user and create database
sudo -u postgres createdb amc_portal
```

## Option 2: Using Docker (Recommended for Testing)

```bash
# Run PostgreSQL in Docker
docker run --name amc-postgres \
  -e POSTGRES_DB=amc_portal \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

## Configure Database Connection

Update the `.env` file in the backend directory with your database credentials:

```bash
# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amc_portal
DB_USER=postgres
DB_PASSWORD=password  # Use your actual password
```

## Test Database Connection

```bash
# Test connection using psql
psql -h localhost -p 5432 -U postgres -d amc_portal

# Or if using Docker:
docker exec -it amc-postgres psql -U postgres -d amc_portal
```
