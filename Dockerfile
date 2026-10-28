FROM node:18-bullseye-slim

# System dependencies: Python aur ffmpeg install karein
RUN apt-get update && \
    apt-get install -y python3 python3-pip ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Global yt-dlp binary install karein
RUN pip3 install --no-cache-dir yt-dlp

# App directory set karein
WORKDIR /app

# Dependencies install karein
COPY package*.json ./
RUN npm install --production

# Baaki saara code aur cookies.txt copy karein
COPY . .

# Port expose karein
EXPOSE 10000

# Application start karein
CMD ["npm", "start"]