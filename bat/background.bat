@echo off
for /F "tokens=1* delims=:" %%a in ("%1") do (
	echo %%b
	for /F "tokens=1* delims=%%20" %%c in ("%%b") do (
		echo %%c
		echo %%d
		streamlink %%c %%d
	)
)