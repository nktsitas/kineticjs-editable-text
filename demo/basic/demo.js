/*jslint browser: true*/

var Kinetic = window.Kinetic;

var stage = new Kinetic.Stage({
    container: 'container',
    width: 600,
    height: 400
});
var layer = new Kinetic.Layer();
// stage-canvas 'border'
var rect = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: 600,
    height: 400,
    stroke: 'black',
    strokeWidth: 4
});

layer.add(rect);
stage.add(layer);

// EditableText parameters
// **IMPORTANT** focusedText variable must be accessible to kinetic.editable.js
// for Ctrl+Enter to work (unfocus). Ensure its a global variable.
// TODO remove this requirement.
var focusedText,
    focusRectW = 100,
    focusRectH = 30,
    cancelTextMouseUp = false,
    canvas = stage.getContent().firstChild;

// cursor style
$(document).on('mouseover', 'canvas', function () {
    document.body.style.cursor = 'text';
});

$(document).on('mouseout', 'canvas', function () {
    document.body.style.cursor = 'default';
});

// when clicked outside canvas
$(document).on('mousedown', function (e) {
    if (focusedText !== undefined) {
        focusedText.unfocus(e);
        focusedText = undefined;
    }
});

// when clicked inside canvas
$(document).on('mousedown', 'canvas', function (e) {
    // if focusedText exists, two possibilities:
    // Either just clicked on an existing text, or
    // Clicked outside a focused text.
    if (focusedText !== undefined) {
        // check if you just clicked a text and dont re-create a new text (cancelTextMouseUp)
        // also do not unfocus.
        if (focusedText.checkClick()) {
            focusedText.findCursorPosFromClick(true);
            cancelTextMouseUp = true;
        } else {
            cancelTextMouseUp = false;
            focusedText.unfocus(e);
        }
    }
    return false;
});

// helper function for mouse click position.
function getFullOffset() {
    var container = $("#container");
    return {
        left: container.scrollLeft() - container.offset().left,
        top: container.scrollTop() - container.offset().top
    };
}

// Mouse up handler. Only inside canvas.
$(document).on('mouseup', 'canvas', function (e) {
    // return if you just clicked on existing text.
    if (cancelTextMouseUp) {
        return;
    }
    // nullify focusedText and do nothing, when just unfocused.
    // If this doesn't exist, every click will create a new TextBox.
    if (focusedText !== undefined) {
        focusedText = undefined;
    } else {
        // Create new EditableText (defaults are in kinetic.editable.js)
        var newText = new Kinetic.EditableText({
            // find click position.
            x: e.pageX + getFullOffset().left + 5,
            y: e.pageY + getFullOffset().top - 5,
            fontFamily: 'Courier',
            fill: '#000000',
            defaultText: "Click to insert text!",
            // pasteModal id to support ctrl+v paste.
            pasteModal: "pasteModalArea"
        });
        layer.add(newText);
        newText.focus();
        focusedText = newText;
        layer.draw();
        newText.on('change', function () {
            console.log("-changing->" + newText.getText() + "<-changing-");
        });

        // click listener for created text.
        newText.on("click", function (evt) {
            evt.cancelBubble = true;
            this.focus();
            focusedText = this;
            return false;
        });
    }
});
