FROM node:20-slim

# Sistem bağımlılıkları (poppler-utils gerekiyor)
RUN apt-get update && apt-get install -y \
  poppler-utils \
  && rm -rf /var/lib/apt/lists/*

# Çalışma klasörü
WORKDIR /app

# Proje dosyalarını kopyala
COPY package*.json ./
RUN npm install

COPY . .

# Sunucuyu başlat
EXPOSE 3000
CMD ["npm", "start"]
