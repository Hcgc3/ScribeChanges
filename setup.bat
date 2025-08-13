@echo off
REM Music Score Editor - Setup Script for Windows
REM This script will help you set up the development environment

echo 🎼 Music Score Editor - Setup Script
echo ====================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js (version 18+) from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js detected
for /f "tokens=1" %%i in ('node --version') do set NODE_VERSION=%%i
echo Found %NODE_VERSION%

REM Check for package managers
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=pnpm
    echo ✅ pnpm detected - using pnpm
    goto install
)

yarn --version >nul 2>&1
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=yarn
    echo ✅ yarn detected - using yarn
    goto install
)

npm --version >nul 2>&1
if %errorlevel% equ 0 (
    set PACKAGE_MANAGER=npm
    echo ✅ npm detected - using npm
    goto install
)

echo ❌ No package manager found!
echo Please install npm, yarn, or pnpm
pause
exit /b 1

:install
echo.
echo 📦 Installing dependencies...
echo This may take a few minutes...
echo.

REM Install dependencies
if "%PACKAGE_MANAGER%"=="pnpm" (
    pnpm install
) else if "%PACKAGE_MANAGER%"=="yarn" (
    yarn install
) else (
    npm install
)

REM Check if installation was successful
if %errorlevel% equ 0 (
    echo.
    echo 🎉 Setup completed successfully!
    echo.
    echo To start the development server, run:
    echo   %PACKAGE_MANAGER% dev
    echo.
    echo Then open your browser to: http://localhost:5173
    echo.
    echo 📚 For more information, see README.md and SETUP.md
    echo.
    pause
) else (
    echo.
    echo ❌ Installation failed!
    echo Please check the error messages above and try again.
    echo You can also try manual installation:
    echo   %PACKAGE_MANAGER% install
    echo.
    pause
    exit /b 1
)

