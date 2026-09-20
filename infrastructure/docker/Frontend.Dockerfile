FROM node:22-alpine AS build
WORKDIR /app

COPY src/cinevector-newweb/package.json src/cinevector-newweb/package-lock.json ./
RUN npm ci

COPY src/cinevector-newweb/ ./
# Stringa vuota = URL relativi (stesso dominio dell'app, /api instradato dal reverse proxy)
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
