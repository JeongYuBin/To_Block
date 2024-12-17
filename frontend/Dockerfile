# Node.js 이미지로 빌드
FROM node:18 AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

# Nginx에서 정적 파일 제공
FROM nginx:latest
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80  
CMD ["nginx", "-g", "daemon off;"]
