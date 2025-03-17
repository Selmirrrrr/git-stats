#!/bin/bash

# Build script for GitStats

echo "Building GitStats solution..."

# Build .NET console application
echo "Building .NET console application..."
dotnet build

# Build React web dashboard
echo "Building React web dashboard..."
cd src/WebUI

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js and npm before continuing"
    exit 1
fi

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Build production version
echo "Building production version of the dashboard..."
npm run build

echo "Build completed successfully!"
echo ""
echo "To run the console application:"
echo "dotnet run --folder <repository-base-path> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>]"
echo ""
echo "To run the web dashboard in development mode:"
echo "cd src/WebUI && npm run dev"
echo ""
echo "To serve the production build of the dashboard:"
echo "cd src/WebUI/dist && npx serve"