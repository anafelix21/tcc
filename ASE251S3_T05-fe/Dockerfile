# Stage 1: Build de la aplicacion React + TypeScript + Vite
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar definicion de dependencias
COPY package*.json ./
RUN npm install

# Copiar codigo fuente y compilar
COPY . .
RUN npm run build

# Stage 2: Servidor Web Nginx de produccion
FROM nginx:alpine

# Copiar bundle compilado de Vite (dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracion de proxy inverso para backend 1 y backend 2
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
