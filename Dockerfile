FROM node:18-slim

# Install dependencies for image conversion
RUN apt-get update && apt-get install -y \
    poppler-utils \
    graphicsmagick \
 && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy files
COPY package.json ./
RUN npm install
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
