FROM node:10
WORKDIR /usr/src/app

# install app dependencies with NPM
COPY package*.json ./
RUN npm install

# copy app source
COPY . . 

EXPOSE 5280

CMD [ "npm", "start" ]

