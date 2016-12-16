# Easy "remote" desktop with cursor sharing
Share your screen to another person without an account. Just type in the secret and start sharing.
Premium feature: As a receiver point onto the screen of the sharing person to guide them.

## Current Features
* Only screen sharing, no real remote access
* Send your cursor to the sharing person. It will be displayed as red dot. Therefore you can guide them where to click.

## Getting started
There are two possible ways to get started.

### Download binaries
Go to [https://netvise.de/remotescreen](https://netvise.de/remotescreen) and download the binary for your platform.

### Build from source
* git clone this repo
* npm install
* npm run build (runs build process for all platforms)

Note: If you want to use your own server the source can be found here: [https://github.com/sean-nicholas/remote-screen-server](https://github.com/sean-nicholas/remote-screen-server)
You also need to change ```js/websocket.js``` (Yes, I know... hardcoded url - wtf?)

## Screenshots
![alt text](https://netvise.de/remotescreen/images/screenshot_1.png "Start screen")
![alt text](https://netvise.de/remotescreen/images/screenshot_2.png "Share screen")
![alt text](https://netvise.de/remotescreen/images/screenshot_4.png "Receive screen")
![alt text](https://netvise.de/remotescreen/images/screenshot_3.png "Send cursor")