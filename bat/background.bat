@echo off
set str=%1
set "var2=%str:*:=%"
streamlink %var2%