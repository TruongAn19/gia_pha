@echo off
setlocal enabledelayedexpansion
title Push project to Git - TruongAn19/gia_pha

echo ====================================================
echo      DONG BO DU AN LEN GITHUB (TruongAn19/gia_pha)
echo ====================================================
echo.

:: 1. Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed on your system or not added to PATH.
    echo Please download and install Git from: https://git-scm.com/
    echo.
    pause
    exit /b
)

:: 2. Check git config user.name and user.email
git config --global user.name >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Git user.name is not set.
    set /p git_name="Enter your Git name (e.g. Truong An): "
    git config --global user.name "!git_name!"
)

git config --global user.email >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Git user.email is not set.
    set /p git_email="Enter your Git email (e.g. an@example.com): "
    git config --global user.email "!git_email!"
)

:: 3. Initialize Git repository if not already initialized
if not exist .git (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
) else (
    echo [INFO] Git repository already initialized.
)

:: 4. Add remote origin if not already added
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Adding remote origin...
    git remote add origin https://github.com/TruongAn19/gia_pha.git
) else (
    echo [INFO] Remote origin already exists. Updating URL to https://github.com/TruongAn19/gia_pha.git...
    git remote set-url origin https://github.com/TruongAn19/gia_pha.git
)

:: 5. Add files
echo [INFO] Adding files to staging area...
git add .

:: 6. Commit
echo [INFO] Committing changes...
git commit -m "Initial commit from local project"

:: 7. Pull from remote to merge existing README.md if it exists
echo [INFO] Pulling from GitHub to merge remote changes (allow-unrelated-histories)...
git pull origin main --allow-unrelated-histories --no-rebase -m "Merge remote branch main"

:: 8. Push to GitHub
echo [INFO] Pushing to GitHub (main)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ====================================================
    echo [SUCCESS] Project successfully pushed to GitHub!
    echo URL: https://github.com/TruongAn19/gia_pha
    echo ====================================================
) else (
    echo.
    echo ====================================================
    echo [WARNING] There was an issue pushing to GitHub.
    echo Please make sure you are logged in to GitHub on your machine
    echo or check if you have write access to TruongAn19/gia_pha.
    echo ====================================================
)

echo.
pause
