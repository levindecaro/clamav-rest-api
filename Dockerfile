FROM node:12.16.3-stretch-slim

LABEL maintainer="Levin Ng"
WORKDIR /clamav-rest-api

COPY src ./src/
COPY package.json package-lock.json ./

RUN npm install helmet && npm install http-auth && npm install --production && npm audit fix &&  \
    chown -R node:node ./

USER node:node
ENTRYPOINT ["npm", "start"]
