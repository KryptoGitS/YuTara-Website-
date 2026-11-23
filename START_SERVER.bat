@echo off
title YuTara Debugging Local Server (Port 8080)
cd /d "%~dp0"
echo Starting YuTara local server at http://localhost:8080 ...
start "" "http://localhost:8080/index.html"
python -m http.server 8080
pause
