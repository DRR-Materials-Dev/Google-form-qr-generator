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

if not exist "dist\index.html" (
  echo [setup] dist が見つかりません。先にビルドを実行します...
  call npm run build
  if errorlevel 1 (
    echo [error] ビルドに失敗しました。
    pause
    exit /b 1
  )
)

echo [preview] ビルド成果物をプレビューします ( http://localhost:4173 )
echo          終了するには Ctrl+C を押してください。
call npm run preview
pause
