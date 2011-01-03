# Interact

Interact is a JS library that has been designed to provide a generic user interaction interface for working on mobile devices.  Mobile devices already provide a greater number of interaction mechanisms that are currently found on desktop devices and this is only likely to keep growing.

Originally interact started as a simple touch module within [Tile5](http://tile5.org/) but needed to become more than that with the introduction of support for the [DeviceOrientation](http://dev.w3.org/geo/api/spec-source-orientation.html) in iOS4.2

The approach is to provide some generic interaction events and then trigger these based on touch events, mouse events or even device orientation events. The intention is to build Interact in a modular way that will support integrating new interaction mechanisms over time without breaking the core interaction events.  In this way, it might be possible to build applications that can adapt more simply to new interaction mechanisms.

Well, that's the theory...