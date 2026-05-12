@echo off
setlocal
cd /d "%~dp0"

if not exist "node_modules" (
  echo [setup] node_modules が見つかりません。npm install を実行します...
  call npm install
  if errorlevel 1 (
    echo [error] npm install に失敗しました。
    pause
    exit /b 1
  )
)

echo [build] 本番ビルドを実行します...
call npm run build
if errorlevel 1 (
  echo [error] ビルドに失敗しました。
  pause
  exit /b 1
)

echo.
echo [build] 完了しました。出力先: dist
pause
