FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# EXPOSE 5000
# CMD ["npm", "start"]
# CMD ["npx", "nodemon", "index.js"]
CMD ["npx", "tsx", "watch", "src/app.ts", "--env-file", ".env"]