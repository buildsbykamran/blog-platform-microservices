FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY . ./

ARG REACT_APP_API_URL
ARG REACT_APP_AWS_S3_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV REACT_APP_AWS_S3_URL=${REACT_APP_AWS_S3_URL}

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
