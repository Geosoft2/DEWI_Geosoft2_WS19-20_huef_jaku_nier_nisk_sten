FROM node:10-alpine

WORKDIR /usr/src/api

COPY package*.json ./

RUN npm install

COPY . .

RUN apk add --no-cache curl

EXPOSE 3001

CMD ["npm", "start"]
