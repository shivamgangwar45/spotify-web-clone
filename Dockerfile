FROM node:20-bookworm-slim

# Install system utilities & ffmpeg
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates python3 ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Download standalone yt-dlp binary directly (no pip/mirror issues)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

# App directory set karein
WORKDIR /app

# Dependencies install karein
COPY package*.json ./
RUN npm install --omit=dev

# Code copy karein
COPY . .

# Port expose karein
EXPOSE 10000

# Start app
CMD ["npm", "start"]