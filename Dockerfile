FROM node:22-alpine
RUN apk add --no-cache su-exec
WORKDIR /app
COPY package.json ./
COPY server ./server
COPY web ./web
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh && mkdir -p /data && chown node:node /data
ENV PORT=8080 DATA_DIR=/data NODE_ENV=production
EXPOSE 8080
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "--no-warnings", "server/server.js"]
