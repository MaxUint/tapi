cd /d client\tapi\builds
for /F "delims=" %%i in ('dir /b') do (rmdir "%%i" /s/q || del "%%i" /s/q)
cd ..
cd /d persistence\data
for /F "delims=" %%i in ('dir /b') do (rm "%%i" /s/q || del "%%i" /s/q)
pause