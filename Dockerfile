#############################################################################################################################
# Stage 0: Install the base dependencies
FROM node:20-alpine@sha256:df01469346db2bf1cfc1f7261aeab86b2960efa840fe2bd46d83ff339f463665 AS dependencies

# Set the working directory to /app
WORKDIR /app

# Copy the package.json and package-lock.json files to /app
COPY package*.json /app/

# Install node dependencies defined in package-lock.json (For production)
RUN npm ci --production

##############################################################################################################################
# Stage 1: Copy required files and deploy
FROM node:20-alpine@sha256:df01469346db2bf1cfc1f7261aeab86b2960efa840fe2bd46d83ff339f463665 AS build

LABEL maintainer="Dhruv Chawla <dchawla3@myseneca.ca>"
LABEL description="Fragments node.js microservice"

USER root

# Set environment variables and disable npm colors and verbose logs
ENV PORT=8080 \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false \
    NODE_ENV=production

# Set the working directory to /app
WORKDIR /app

# Copy the generated dependencies 
COPY --from=dependencies /app /app

# Copy the source code to /app/src/
COPY --chown=node:node ./src ./src

# Copy the HTPASSWD file for authentication
COPY ./tests/.htpasswd ./tests/.htpasswd

# Install curl for the health check
RUN apk update && apk add curl

# Switch to the node user
USER node

# Start the server when the container starts
CMD npm start

# Expose port 8080
EXPOSE 8080

# Add a health check to ensure the service is running
HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD curl --fail localhost:8080 || exit 1
