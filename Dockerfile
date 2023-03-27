FROM node:hydrogen-alpine
ENV PORT 1234

# Installs latest Chromium (100) package.
RUN apk add chromium

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory
WORKDIR /app

# Add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Install and cache app dependencies
COPY package*.json /app/
RUN npm ci
COPY . /app/
RUN npm run build

# Start Express server
EXPOSE ${PORT}
CMD [ "node", "build/index.js" ]
