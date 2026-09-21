@echo off
rem Duplo clique para instalar. O Bypass vale so para esta execucao; o
rem instalador libera a politica do usuario para os proximos terminais.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install.ps1"
pause
