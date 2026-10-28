FROM node:20-bookworm-slim

# Install system dependencies (Python3, FFmpeg, curl, ca-certificates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install standalone yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Ignore local Windows executable inside Linux container
RUN rm -f yt-dlp.exe

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]