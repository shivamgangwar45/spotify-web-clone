FROM node:20-bookworm-slim

# Working directory set karein
WORKDIR /app

# Production dependencies install karein
COPY package*.json ./
RUN npm install --omit=dev

# Source code copy karein
COPY . .

# Expose Render Web Port
EXPOSE 10000

# Start server
CMD ["npm", "start"]