# ---- EazyRents API (Node / Express) ----
# node:22 (Debian-based) rather than -slim/alpine because the app uses a native
# module (bcrypt); the full image already has the toolchain, so the build "just
# works". Once it's stable you'd slim this down with a multi-stage build.
FROM node:22

WORKDIR /app

# Copy manifests first so this layer stays cached unless dependencies change.
# (No package-lock.json is committed, so we use `npm install`, not `npm ci`.)
COPY package.json ./
RUN npm install

# Copy the rest of the source.
COPY . .

# The app reads PORT from the environment. Documented default: 3000.
EXPOSE 3000

# Migrations are run by the dedicated `migrate` service in docker-compose
# before this container starts, so the schema already exists here.
CMD ["node", "src/server.js"]
