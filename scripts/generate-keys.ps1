# generate-keys.ps1 — Windows PowerShell version
# Requires OpenSSL installed (comes with Git for Windows)

New-Item -ItemType Directory -Force -Path ".\keys" | Out-Null

openssl genrsa -out .\keys\private.pem 2048
openssl rsa -in .\keys\private.pem -pubout -out .\keys\public.pem

Write-Host "✓ RS256 key pair generated in .\keys\" -ForegroundColor Green
Write-Host "  private.pem — keep SECRET, used by auth-service" -ForegroundColor Yellow
Write-Host "  public.pem  — shared with api-gateway and all services" -ForegroundColor Cyan
