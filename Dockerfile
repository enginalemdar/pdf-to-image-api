FROM node:20

# Puppeteer için gerekli sistem kütüphaneleri
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
  libu2f-udev \
  libvulkan1 \
  libxcb-dri3-0 \
  libxshmfence1 \
  libgbm1 \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*

# Uygulama dizini
WORKDIR /app

# Dosyaları kopyala
COPY . .

# Paketleri yükle
RUN npm install

# Port aç
EXPOSE 3000

# Uygulama başlat
CMD ["npm", "start"]
