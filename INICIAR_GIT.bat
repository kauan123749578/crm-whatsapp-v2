@echo off
echo ========================================
echo   Inicializando Git para CRM WhatsApp v2
echo ========================================
echo.

echo [1/4] Verificando se Git esta instalado...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git nao esta instalado!
    echo Por favor, instale Git de: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo OK: Git encontrado
echo.

echo [2/4] Inicializando repositorio Git...
if exist ".git" (
    echo AVISO: Git ja foi inicializado nesta pasta
    echo Continuando mesmo assim...
) else (
    git init
    git branch -M main
    echo OK: Repositorio inicializado
)
echo.

echo [3/4] Adicionando arquivos ao Git...
git add .
if %errorlevel% neq 0 (
    echo ERROR: Falha ao adicionar arquivos
    pause
    exit /b 1
)
echo OK: Arquivos adicionados
echo.

echo [4/4] Verificando status...
git status --short | findstr /V "^$" | Select-Object -First 20
echo.
echo ========================================
echo   Proximos passos:
echo ========================================
echo.
echo 1. Criar repositorio no GitHub:
echo    https://github.com/new
echo.
echo 2. Conectar ao GitHub:
echo    git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
echo.
echo 3. Fazer primeiro commit:
echo    git commit -m "feat: CRM WhatsApp v2 - Sistema completo"
echo.
echo 4. Fazer push:
echo    git push -u origin main
echo.
echo Veja SETUP_REPOSITORIO.md para instrucoes completas!
echo.
pause



