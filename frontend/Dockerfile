FROM node:22-alpine

WORKDIR /app

COPY . .

RUN if [ -f package.json ]; then npm install; fi

EXPOSE 5173

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev -- --host 0.0.0.0; else echo 'Frontend project is not bootstrapped yet.' && sleep infinity; fi"]
