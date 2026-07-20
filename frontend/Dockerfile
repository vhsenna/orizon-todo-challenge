FROM node:22-alpine AS dev

WORKDIR /app

COPY . .

RUN if [ -f package.json ]; then npm install; fi

EXPOSE 5173

CMD ["sh", "-c", "if [ -f package.json ]; then npm run dev -- --host 0.0.0.0; else echo 'Frontend project is not bootstrapped yet.' && sleep infinity; fi"]

FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:8000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
