FROM node:15-alpine

WORKDIR /usr/bot

COPY tsconfig.json package.json /usr/bot/

RUN npm i

COPY ./src /usr/bot/src/

RUN npm run build

CMD [ "node", "/usr/bot/dist/index.js" ]
