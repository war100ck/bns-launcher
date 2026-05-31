@echo off
chcp 65001 >nul
cls
echo ======================================================
echo  [BUILD] Production-сборка BNS Launcher (Tauri)
echo ======================================================
echo.
echo [1/2] Очистка кэша Cargo...
cargo clean
echo.
echo [2/2] Компиляция и упаковка...
cargo tauri build
if %errorlevel% equ 0 (
    echo.
    echo [OK] Сборка завершена!
    echo Файлы: src-tauri\target\release\bundle
) else (
    echo [ОШИБКА] Сборка завершилась с ошибкой
)
pause