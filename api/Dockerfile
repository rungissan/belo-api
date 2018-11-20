FROM node:slim

RUN apt-get update && apt-get -y install imagemagick graphicsmagick

RUN mkdir -p /usr/src/app

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

RUN yarn global add nodemon sequelize-cli babel-cli mocha

RUN yarn install
