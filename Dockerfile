FROM node:18-alpine3.15
WORKDIR /app 

COPY package*.json ./
RUN npm install

RUN cd /app && ls -a

EXPOSE 5173

CMD ["npm","run", "dev"]
