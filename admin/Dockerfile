FROM node:slim

# Создать директорию app
WORKDIR /usr/src/app

# Установить nodemon для горячей перезагрузки
RUN yarn global add nodemon serve

# Установить зависимости приложения
# Используется символ подстановки для копирования как package.json, так и package-lock.json,
# работает с npm@5+
COPY package*.json ./
COPY yarn.lock ./

RUN yarn install

# Скопировать исходники приложения
COPY . ./

RUN yarn run build 


EXPOSE 3000




