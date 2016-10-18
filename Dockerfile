FROM cusspvz/node

WORKDIR /app/

COPY server.js package.json /app/

RUN npm install

ENTRYPOINT ["npm", "start"]
