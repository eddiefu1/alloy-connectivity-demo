#!/bin/bash

# Database Seeding Script
# This script seeds the database with initial data

set -e

echo "Starting database seeding..."

# Load environment variables if .env file exists
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
  echo "Error: Required database environment variables are not set"
  echo "Please ensure DB_HOST and DB_NAME are defined in your .env file"
  exit 1
fi

echo "Connected to database: $DB_NAME at $DB_HOST"

# Add your seeding logic here
# Example:
# psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f ./seed-data.sql

echo "Database seeding completed successfully!"
