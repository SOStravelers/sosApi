# Usar la imagen base con Node.js 20.10.0
FROM node:20.10.0-slim

# Instalar dependencias del sistema necesarias para Puppeteer y Chrome
RUN apt-get update && apt-get install -y \
    wget \
    libx11-dev \
    libgbm1 \
    libvulkan1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libxss1 \
    libnspr4 \
    libnss3 \
    libgdk-pixbuf2.0-0 \
    libdrm2 \
    && rm -rf /var/lib/apt/lists/*

# Descargar e instalar Google Chrome (estable)
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb && \
    dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -f -y

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar el package.json y package-lock.json (si existe)
COPY package*.json ./

# Instalar dependencias del proyecto
RUN npm install

# Copiar el resto del código del proyecto
COPY . .

# Exponer el puerto en el que el servidor escucha (ajustalo según tu aplicación)
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
