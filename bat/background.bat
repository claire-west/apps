@echo off
for /F "tokens=1* delims=:" %%a in ("%1") do (
	for /F "tokens=1* delims=%%20" %%c in ("%%b") do (
		streamlink %%c %%d
	)
)