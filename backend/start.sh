#!/bin/sh
# Startup for the Render deployment: ensure the database schema is current,
# then start the API. node-pg-migrate is idempotent, so running it on every
# start is a safe no-op once migrations are already applied.
set -e
npm run migrate up
node src/server.js