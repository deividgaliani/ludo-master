@echo off
title Ludo Master - Jogo de Tabuleiro Web
cd /d "%~dp0"

echo ========================================================
echo           LUDO MASTER - Jogo de Tabuleiro Web
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Node.js nao foi encontrado no seu computador!
    echo Por favor, instale o Node.js em: https://nodejs.org
    pause
    exit /b
)

if not exist "node_modules\" (
    echo [1/2] Instalando dependencias do jogo...
    call npm install
)

echo.
echo [2/2] Iniciando servidor local e abrindo o jogo no navegador...
echo.
echo Acessando: http://localhost:5173
echo.

start "" "http://localhost:5173"
call npm run dev -- --host 127.0.0.1 --port 5173

pause
