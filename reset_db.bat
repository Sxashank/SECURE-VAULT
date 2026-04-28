@echo off
TITLE Secure Vault Database Reset
echo ==========================================
echo Resetting and Seeding Secure Vault Database
echo ==========================================

cd backend
echo Re-initializing Database Schema...
call npm run db:init

echo.
echo Seeding Demo Users and Mock File Records...
call npx tsx seed_demo.ts

echo.
echo Database has been completely reset and seeded!
pause
