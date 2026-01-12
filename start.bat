@echo off
REM ChatterBox - Start Script (Windows)
REM Starts both Backend (Spring Boot) and Frontend (Next.js)

echo.
echo Starting ChatterBox Application...
echo.

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

REM Start Backend (Spring Boot) in a new window
echo Starting Backend (Spring Boot) on port 8080...
start "ChatterBox Backend" cmd /c "mvnw.cmd spring-boot:run"

REM Wait a bit for backend to start
timeout /t 5 /nobreak > nul

REM Start Frontend (Next.js) in a new window
echo Starting Frontend (Next.js) on port 3000...
cd frontend
start "ChatterBox Frontend" cmd /c "npm run dev"
cd ..

echo.
echo ========================================
echo   ChatterBox is starting!
echo ========================================
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Open your browser at: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul
