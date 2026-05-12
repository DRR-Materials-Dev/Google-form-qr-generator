@echo off
setlocal
cd /d "%~dp0Google-form-qr-generator"

echo [setup] Node / npm のバージョンを確認します...
where node >nul 2>nul
if errorlevel 1 (
  echo [error] Node.js が見つかりません。https://nodejs.org/ から Node.js 20 以上をインストールしてください。
  pause
  exit /b 1
)
node --version
npm --version

echo.
echo [setup] npm install を実行します...
call npm install
if errorlevel 1 (
  echo [error] npm install に失敗しました。
  pause
  exit /b 1
)

echo.
echo [setup] 完了しました。次のいずれかをダブルクリックしてください:
echo   dev.bat     ... 開発サーバーを起動
echo   build.bat   ... 本番ビルド
echo   preview.bat ... ビルド成果物をローカル確認
pause
