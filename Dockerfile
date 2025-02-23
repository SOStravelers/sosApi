# Usa una imagen base oficial de Node.js
FROM node:16

# Instalar dependencias necesarias para Chromium
RUN apt-get update && apt-get install -y \
  wget \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends

# Descargar e instalar Chromium
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN dpkg -i google-chrome-stable_current_amd64.deb
RUN apt-get install -f

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el código fuente de tu proyecto al contenedor
COPY . .

# Instalar las dependencias de Node.js
RUN npm install

# Exponer el puerto en el que se ejecuta la app
EXPOSE 3000

# Comando para iniciar la aplicación (asegúrate de que este comando sea el correcto)
CMD ["npm", "start"]
