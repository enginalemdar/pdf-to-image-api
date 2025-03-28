# Use official Node.js image
FROM node:18-slim

# Create app directory
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Bundle app source
COPY server.js ./

# Expose port
EXPOSE 3000

# Start server
CMD [ "node", "server.js" ]
