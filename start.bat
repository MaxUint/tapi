@echo off
cls
for /F "delims=" %%R in ('
    tasklist /FI "WindowTitle eq TAPISERVER" /FO CSV /NH
') do (
    set "FLAG1=" & set "FLAG2="
    for %%C in (%%R) do (
        if defined FLAG1 (
            if not defined FLAG2 (
		if not %%~C==No (
               		taskkill /PID %%~C /f
		)
            )
            set "FLAG2=#"
        )
        set "FLAG1=#"
    )
)
for /F "delims=" %%R in ('
    tasklist /FI "WindowTitle eq TAPISERVER" /FO CSV /NH
') do (
    set "FLAG1=" & set "FLAG2="
    for %%C in (%%R) do (
        if defined FLAG1 (
            if not defined FLAG2 (
                if not %%~C==No (
               		taskkill /PID %%~C /f
		)
            )
            set "FLAG2=#"
        )
        set "FLAG1=#"
    )
)
title TAPISERVER
:A
node tapi/client.js
echo if you have an error, you probably don't have nodejs, install nodejs at https://nodejs.org/en/
GOTO :A
