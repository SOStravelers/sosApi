# Utilizar una imagen base que soporte Node.js
FROM node:20.10.0

# Directorio de trabajo
WORKDIR /app

# Copiar los archivos necesarios
COPY . .

# Instalar dependencias
RUN npm install

# Instalar Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    libgbm1 \
    libvulkan1

# Exponer el puerto en el que la app escuchará
EXPOSE 3000

# Establecer la variable de entorno que Puppeteer necesita
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Comando para iniciar la aplicación
CMD ["npm", "start"]
