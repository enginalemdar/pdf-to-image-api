FROM node:18

# Gerekli bağımlılıkları kur: GraphicsMagick!
RUN apt-get update && \
    apt-get install -y graphicsmagick && \
    rm -rf /var/lib/apt/lists/*

# Çalışma dizini
WORKDIR /app

# Uygulama dosyalarını kopyala
COPY . .

# Paketleri yükle
RUN npm install

# Uygulama portu
EXPOSE 3000

# Başlat
CMD ["npm", "start"]
