FROM node:22

WORKDIR /backend
COPY package*.json .
# RUN npm install
RUN npm cache clean --force
RUN npm ci
COPY . .
EXPOSE 8080
CMD npm start

