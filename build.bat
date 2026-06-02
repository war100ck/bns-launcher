@echo off
chcp 65001 >nul
cls
echo ======================================================
echo  [BUILD] Production-сборка BNS Launcher (Tauri)
echo ======================================================
echo.

REM Переходим в папку src-tauri, где лежит Cargo.toml
cd /d "%~dp0src-tauri"
if errorlevel 1 (
    echo [ОШИБКА] Не удалось перейти в папку src-tauri
    pause
    exit /b 1
)

echo [Текущая директория]: %CD%
echo.

echo [1/2] Очистка кэша Cargo...
cargo clean
if errorlevel 1 (
    echo [ОШИБКА] Не удалось очистить кэш Cargo
    pause
    exit /b 1
)
echo.

echo [2/2] Компиляция и упаковка...
cargo tauri build
if errorlevel 1 (
    echo.
    echo [ОШИБКА] Сборка завершилась с ошибкой
    pause
    exit /b 1
)

echo.
echo ======================================================
echo  [OK] Сборка успешно завершена!
echo ======================================================
echo.
echo Файлы находятся в папке:
echo   src-tauri\target\release\bundle\
echo.
echo Установщик NSIS:
echo   src-tauri\target\release\bundle\nsis\*.exe
echo.
echo Portable EXE:
echo   src-tauri\target\release\BNS Launcher.exe
echo.
pause