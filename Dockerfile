FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

ENV REACT_APP_API_BASE_URL=/service/journal
ENV REACT_APP_API_PATIENTS_URL=/service/journal/api/patients
ENV REACT_APP_API_USERMANAGER_URL=/service/users
ENV REACT_APP_API_MESSAGESERVICE_URL=/service/messages
ENV REACT_APP_API_SEARCHSERVICE_URL=/service/search
RUN npm run build


FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=build /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
