# Use Node.js as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Copy the .env file into the container
COPY .env .env 

# Expose the backend port (change if your backend uses a different port)
EXPOSE 8080

# Command to run the backend server
CMD ["npm", "run", "server"]
