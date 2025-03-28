# Node tabanlı imaj
FROM node:18

# ImageMagick yüklü değilse pdf2pic çalışmaz
RUN apt-get update && \
    apt-get install -y imagemagick && \
    rm -rf /var/lib/apt/lists/*

# Uygulama dosyalarını kopyala
WORKDIR /app
COPY . .

# Paketleri kur
RUN npm install

# Port
EXPOSE 3000

# Başlat
CMD ["npm", "start"]
