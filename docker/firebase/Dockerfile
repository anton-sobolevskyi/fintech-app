FROM node:24-bookworm

# firebase-tools requires JDK 21+ for Firestore/Storage emulators
# Install prerequisites, add the official Eclipse Temurin (Adoptium) repository and key, then install JDK 21
RUN apt-get update && apt-get install -y --no-install-recommends \
        wget gnupg ca-certificates apt-transport-https \
    && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public \
        | gpg --dearmor -o /usr/share/keyrings/adoptium.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb bookworm main" \
        > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends temurin-21-jdk \
    && rm -rf /var/lib/apt/lists/* \
    && java -version

RUN npm install -g firebase-tools

WORKDIR /app

COPY functions/package.json functions/package-lock.json ./functions/
RUN npm ci --prefix functions

COPY docker/firebase/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV JAVA_TOOL_OPTIONS="-Xmx1g"

EXPOSE 4000 4400 4500 5001 5002 8080 9099 9199

ENTRYPOINT ["/entrypoint.sh"]
