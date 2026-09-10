#!/bin/sh
# Startup for Render's free tier (which can't run a separate pre-deploy step):
# apply any pending migrations, then hand off to the server.
#
# `set -e`  -> if migrations fail, stop here so the failure is visible.
# `exec`    -> node replaces this shell as PID 1, so it receives Render's
#              SIGTERM on shutdown and the app's graceful-shutdown code runs.
set -e
npm run migrate up
exec node src/server.js
