#!/bin/bash
# Generate RS256 key pair for JWT signing
mkdir -p keys
openssl genrsa -out keys/private.pem 2048
openssl rsa -in keys/private.pem -pubout -out keys/public.pem
echo "✓ RS256 key pair generated in ./keys/"
echo "  private.pem — keep SECRET, used by auth-service"
echo "  public.pem  — shared with api-gateway and all services"
