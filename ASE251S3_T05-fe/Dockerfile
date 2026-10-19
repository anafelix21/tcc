# Stage 1: Build Angular application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve application with Nginx
FROM nginx:alpine
# Copiar los archivos compilados del build de Angular
COPY --from=builder /app/dist/AgropacayalesWeb/browser /usr/share/nginx/html

# Copiar configuración personalizada de Nginx para manejar rutas SPA (Single Page Application)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


# ==============================================================================
# 🚀 COMANDOS RÁPIDOS PARA EL EXAMEN (Docker Hub: hugo454)
# ==============================================================================
#
# 1. Construir la imagen del Frontend:
#    docker build -t hugo454/agropacayales-frontend:1.0 .
#
# 2. Iniciar sesión en Docker Hub (si no lo has hecho):
#    docker login
#
# 3. Subir la imagen a Docker Hub:
#    docker push hugo454/agropacayales-frontend:1.0
#
# 4. Probar localmente en el puerto 80:
#    docker run -d --name angular-frontend -p 80:80 hugo454/agropacayales-frontend:1.0
#
# ==============================================================================
