# Interact

Interact is essentially a wrapper on top of touch and mouse events.  It exists to make the process of writing apps / demos that handle touch events both simpler to write and also allow them to support mouse events easily.

Events are distributed using [eve](https://github.com/DmitryBaranovskiy/eve).

_Interact is distributed under an [MIT License](http://www.opensource.org/licenses/mit-license.php)_

## Example Usage

Handling simple down, move, and up events is easy:

```js
eve.on('interact.pointer.down', function(absXY, relXY) {
	console.log('pointer down @ ', absXY);
});

// handle pointer move events
eve.on('interact.pointer.move', function(absXY, relXY) {
	console.log('pointer move @ ', absXY);
});

// handle pointer up events
eve.on('interact.pointer.up', function(absXY, relXY) {
	console.log('pointer up @ ', absXY);
});

// watch the specified target
INTERACT.watch('targetElementId');
```

Through the way [eve](https://github.com/DmitryBaranovskiy/eve) behaves, the above event handlers would relay events captured for any _watched_ elemnet.  If you want to limit the event capture to a specific event then use the following syntax:

```js
eve.on('interact.pointer.down.targetElementId', function(absXY, relXY) {
	console.log('pointer down @ ', absXY);
});
```

## Pan and Zoom Helpers

To be completed

## Multi Touch Event Handlers

To be completed.