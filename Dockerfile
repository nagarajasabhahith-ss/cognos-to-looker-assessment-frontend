FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app source
COPY . .

# Build app (only for production)
# RUN npm run build

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
