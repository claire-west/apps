## Security Notice

This tool involves running a batch script located on your computer. When you click a link using the custom protocol it will run this script. While unlikely, if you click a link elsewhere that uses a protocol with the same name it is possible someone could take advantage of this. Use at your own risk.

## Prerequisites

- VLC
- Streamlink

## Protocol Setup

1. In regedit, find HKEY_CLASSES_ROOT
2. Add a key named "livestreamer"
3. Set livestreamer's default string to "URL:Livestreamer Protocol"
4. Add an empty string to livestreamer called "URL Protocol"
5. Add a key to livestreamer named "shell"
6. Add a key to shell named "open"
7. Add a key to open named "command"
8. Set command's default string to the path of launch.bat (see below)
9. The final structure should look like this:

```
HKEY_CLASSES_ROOT
  livestreamer
    (Default) = "URL:Livestreamer Protocol"
    URL Protocol = ""
    shell
      open
        command
          (Default) = "C:\...\launch.bat" "%1"
```
