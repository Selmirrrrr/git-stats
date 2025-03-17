#!/bin/bash

# Simple script to run GitStats

# Check if dotnet is installed
if ! command -v dotnet &> /dev/null; then
    echo "Error: dotnet is not installed or not in PATH"
    exit 1
fi

# Check if at least the folder parameter is provided
if [ "$#" -lt 2 ] || [ "$1" != "--folder" ]; then
    echo "Usage: ./run.sh --folder <repository-base-path> [--start-date <yyyy-MM-dd>] [--end-date <yyyy-MM-dd>] [--output-json <output.json>] [--output-csv <output.csv>]"
    exit 1
fi

# Run the application with all arguments passed to this script
dotnet run --project . -- "$@"