@echo off
:A
WHERE npm
echo INSTALLING...
IF %ERRORLEVEL% NEQ 0 (
	ECHO NPM NOT FOUND, TRY REINSTALLING https://nodejs.org/en/
) else (
	npm install express
)
timeout /t 15
GOTO :A