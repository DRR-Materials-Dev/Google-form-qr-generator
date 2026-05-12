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

echo [dev] 開発サーバーを起動します ( http://localhost:5173 )
echo       終了するには Ctrl+C を押してください。
call npm run dev
pause
