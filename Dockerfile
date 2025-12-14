FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ENV REACT_APP_API_BASE_URL=/service/journal
ENV REACT_APP_API_PATIENTS_URL=/service/journal/api/patients
ENV REACT_APP_API_USERMANAGER_URL=/service/users
ENV REACT_APP_API_MESSAGESERVICE_URL=/service/messages
ENV REACT_APP_API_SEARCHSERVICE_URL=/service/search
ENV REACT_APP_API_IMAGEEDITOR_URL=/service/images
ENV REACT_APP_WEBSOCKET_URL=wss://patientjournal-frontendreact.app.cloud.cbh.kth.se/service/event-listener/ws/messages

RUN npm run build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]