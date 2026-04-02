# Stage 1: Build
FROM node:20-slim AS build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# 빌드된 dist 폴더를 nginx의 html 경로로 복사
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Nginx 설정 파일이 필요한 경우 추가 (기본 설정 사용)
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
