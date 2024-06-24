# Stage 1: Build the application
FROM node:20.9.0 AS builder
LABEL maintainer="Dhruv Chawla <dchawla3@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable colour when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# Use /app as our working directory
WORKDIR /app

# Copy package.json and package-lock.json files to the working directory
COPY package.json package-lock.json ./

# Install node dependencies defined in package-lock.json
RUN npm install

# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# Stage 2: Create the runtime image
FROM node:20.9.0
WORKDIR /app

# Copy the build artifacts from the builder stage
COPY --from=builder /app .

# Start the container by running our server
CMD npm start

# We run our service on port 8080
EXPOSE 8080
