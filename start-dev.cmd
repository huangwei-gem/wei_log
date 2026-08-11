@echo off
setlocal
title Wei Log - Dev Server

echo ==============================================
echo   Wei Log - Local Dev Server
echo   Press Ctrl+C to stop the server.
echo ==============================================
echo.
cd /d "%~dp0"
call npm run dev