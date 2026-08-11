@echo off
setlocal
title Wei Log - One-Click Publish

echo ==============================================
echo   Wei Log - One-Click Publish
echo   Scan, Build, Commit, Push, Deploy
echo ==============================================
echo.

cd /d "%~dp0"

echo [1/4] Scanning portfolio folders...
call npm run scan -- --english
if errorlevel 1 goto :error
echo.

echo [2/4] Building production bundle...
call npm run build
if errorlevel 1 goto :error
echo.

echo [3/4] Committing changes...
git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Update portfolio"
    if errorlevel 1 goto :error
) else (
    echo       Nothing to commit - working tree clean.
)
echo.

echo [4/4] Pushing to GitHub...
git push
if errorlevel 1 goto :error

echo.
echo ==============================================
echo   DONE! Site is being deployed automatically.
echo   Live at:  https://wei-log.pages.dev
echo ==============================================
echo.
pause
exit /b 0

:error
echo.
echo   ERROR: Something went wrong. Check the messages above.
echo.
pause
exit /b 1