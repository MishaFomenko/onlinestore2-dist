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

ARG STRIPE_SECRET_KEY_A
ARG ALGOLIA_ID_A
ARG ALGOLIA_ADMIN_KEY_A
ARG ALGOLIA_SEARCH_KEY_A
ARG FIREBASE_API_KEY_A
ARG PUBLIC_IP_A

ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY_A
ENV ALGOLIA_ID=$ALGOLIA_ID_A
ENV ALGOLIA_ADMIN_KEY=$ALGOLIA_ADMIN_KEY_A
ENV ALGOLIA_SEARCH_KEY=$ALGOLIA_SEARCH_KEY_A
ENV FIREBASE_API_KEY=$FIREBASE_API_KEY_A
ENV PUBLIC_IP=$PUBLIC_IP_A

# Expose the port that the application listens on.
EXPOSE 3001

# Run the application.
CMD node server.js
# CMD npx nodemon server.js
