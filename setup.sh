#!/bin/bash

echo "==================================="
echo "Wallet Service Setup Script"
echo "==================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker and Docker Compose are installed"

# Stop any existing containers
echo ""
echo "Stopping any existing containers..."
docker-compose down

# Build and start services
echo ""
echo "Building and starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo ""
echo "Waiting for services to be ready..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "wallet_app.*Up"; then
    echo ""
    echo "==================================="
    echo "✓ Setup Complete!"
    echo "==================================="
    echo ""
    echo "Service is running at: http://localhost:3000"
    echo ""
    echo "Test the service:"
    echo "  curl http://localhost:3000/health"
    echo "  curl http://localhost:3000/api/wallet/balance/USR-001"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f app"
    echo ""
    echo "Stop services:"
    echo "  docker-compose down"
else
    echo ""
    echo "Error: Services failed to start. Check logs with:"
    echo "  docker-compose logs"
    exit 1
fi
