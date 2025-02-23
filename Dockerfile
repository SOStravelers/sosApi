# Usar una imagen base de Node.js
FROM node:20.10.0-buster

# Setear el directorio de trabajo en el contenedor
WORKDIR /app

# Copiar los archivos package.json y package-lock.json al contenedor
COPY package*.json ./

# Instalar las dependencias de Node.js
RUN npm install

# Instalar dependencias para Chromium
RUN apt-get update && \
    apt-get install -y wget ca-certificates \
    && wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && dpkg -i google-chrome-stable_current_amd64.deb \
    && apt-get install -f -y

# Copiar el resto de los archivos del proyecto al contenedor
COPY . .

# Exponer el puerto que va a usar la aplicación
EXPOSE 8080

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
