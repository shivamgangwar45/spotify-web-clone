FROM node:18-bullseye-slim

# Install system dependencies (Python, FFmpeg, curl)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp Linux binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Ignore Windows .exe file on Linux container
RUN rm -f yt-dlp.exe

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]