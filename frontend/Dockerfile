# ---- Build stage: compile the React/Vite app to static files ----
FROM node:22-slim AS build

WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Vite bakes env vars into the bundle at BUILD time, so the URL the browser
# will call the API on must be supplied here as a build argument.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---- Serve stage: hand the static files to a tiny nginx ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
