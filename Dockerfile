FROM node:lts-alpine3.20

WORKDIR /code

COPY . /code/

RUN npm install

EXPOSE 5000

CMD [ "npm", "start" ]