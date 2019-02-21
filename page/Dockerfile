FROM node:8-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install express body-parser redis
EXPOSE 9000 6379
CMD ["node", "node/meh.js"]
