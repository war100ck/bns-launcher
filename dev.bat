@echo off
chcp 65001 >nul
cls
echo ======================================================
echo  [DEV] Запуск среды разработки BNS Launcher
echo ======================================================
echo.
cargo tauri dev
pause