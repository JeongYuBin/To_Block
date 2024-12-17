# Node.js 이미지 사용
FROM node:18

# 작업 디렉토리 설정
WORKDIR /app

# 종속성 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm install

# PM2 설치
RUN npm install -g pm2

# 애플리케이션 코드 복사
COPY . .

# PM2로 앱 실행
CMD ["pm2-runtime", "start", "bin/www"]

# Expose port
EXPOSE 20302

