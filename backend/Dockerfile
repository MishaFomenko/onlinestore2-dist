# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG NODE_VERSION=20.5.1

FROM node:${NODE_VERSION}-alpine

# Use production node environment by default.
ENV NODE_ENV production


WORKDIR /usr/src/app

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Run the application as a non-root user.
USER node

# Copy the rest of the source files into the image.
COPY . .

ENV STRIPE_SECRET_KEY=process.env.STRIPE_SECRET_KEY
ENV ALGOLIA_ID=process.env.ALGOLIA_ID
ENV ALGOLIA_ADMIN_KEY=process.env.ALGOLIA_ADMIN_KEY
ENV ALGOLIA_SEARCH_KEY=process.env.ALGOLIA_SEARCH_KEY
ENV FIREBASE_API_KEY=process.env.FIREBASE_API_KEY
ENV PUBLIC_IP=process.env.PUBLIC_IP

# Expose the port that the application listens on.
EXPOSE 3001

# Run the application.
CMD node server.js
# CMD npx nodemon server.js
