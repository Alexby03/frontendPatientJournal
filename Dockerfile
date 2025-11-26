FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV REACT_APP_API_BASE_URL=/service/journal
ENV REACT_APP_API_PATIENTS_URL=/service/journal/api/patients
ENV REACT_APP_API_USERMANAGER_URL=/service/users
ENV REACT_APP_API_MESSAGESERVICE_URL=/service/messages

RUN npm run build

FROM nginx:alpine

RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    \
    # React App (Frontend) \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri /index.html; \
    } \
    \
    # Journal Service (Handles BASE_URL and PATIENTS_URL) \
    location /service/journal/ { \
        proxy_pass http://patientjournal-journalservice:8081/; \
    } \
    \
    # User Manager Service \
    location /service/users/ { \
        proxy_pass http://patientjournal-usermanager:8082/; \
    } \
    \
    # Message Service \
    location /service/messages/ { \
        proxy_pass http://patientjournal-messageservice:8083/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
