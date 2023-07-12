FROM node:16.0-alpine AS build-stage

WORKDIR /app

COPY package*.json /app/
RUN npm install --force

COPY . /app
RUN npm run build

FROM nginx:1.17.1-alpine
WORKDIR /app
COPY  --from=build-stage /app/dist/ /usr/share/nginx/html/
COPY /nginx-custom.conf /etc/nginx/conf.d/default.conf


