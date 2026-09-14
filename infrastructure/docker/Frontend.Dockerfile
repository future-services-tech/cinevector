FROM node:22-alpine AS build
WORKDIR /app

COPY src/cinevector-web/package.json src/cinevector-web/package-lock.json ./
RUN npm ci

COPY src/cinevector-web/ ./
ARG VITE_API_BASE_URL=http://localhost:5080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY infrastructure/docker/nginx.frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
