#!/bin/bash

echo "Setting up production database..."

# Set the production DATABASE_URL
export DATABASE_URL="postgresql://neondb_owner:npg_xpRJN6b4Oqwj@ep-sparkling-dew-a4r50q4k-pooler.us-east-1.aws.neon.tech/neondb?connect_timeout=15&sslmode=require"

# Run migrations
echo "Running migrations..."
npx prisma migrate deploy

# Seed database
echo "Seeding with 130 inventory items..."
npx prisma db seed

echo "✅ Production database ready!"
