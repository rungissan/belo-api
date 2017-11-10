FROM node:slim

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

RUN yarn global add nodemon loopback-cli sequelize-cli babel-cli
RUN yarn install
