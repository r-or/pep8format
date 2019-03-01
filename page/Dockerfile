FROM node:8-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN npm install express body-parser redis https helmet
EXPOSE 9080 9443 6379
CMD ["node", "node/meh.js"]
