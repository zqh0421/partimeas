FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# use this Dockerfile to install additional tools you might need, e.g.
# RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
#     && apt-get -y install --no-install-recommends <your-package-list-here>

# Install Node (handled via devcontainer features too, this is optional fallback)
RUN apt-get update && apt-get install -y curl git && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /workspaces/partimeas

# Default shell
SHELL ["/bin/bash", "-c"]
