/**
 * KineticJS EditableText Extension
 * Compatible with KineticJS JavaScript Library v5.1.0
 * Author: Nikos Tsitas
 * Date: June 29 2014
 */

////////////////////
//  EditableText  //
////////////////////

// Define Kinetic.EditableText globally or
// Define KineticModule.EditableText if an AMD or CommonJS module loader is detected
function init(KineticModule){
    var Kinetic = window.Kinetic || KineticModule;

    if (typeof Kinetic === "undefined")
        throw new Error("Kinetic must be a global variable or passed to init.");

    /**
     * EditableText constructor.  EditableText extends Text
     * @constructor
     * @param {Object} config
     */
    Kinetic.EditableText = function (config) {
        config.name = "EditableText";

        config.fontSize = config.fontSize || 16;
        config.lineHeight = config.lineHeight || 1.3;
        config.focusRectColor = config.focusRectColor || 'black';
        config.unfocusOnEnter = config.unfocusOnEnter || false;
        config.pasteModal = config.pasteModal || null;

        var textHeight = config.fontSize;
        this.lineHeightPx = config.lineHeight * textHeight;

        this.initialRectW = (100 < config.fontSize * 3) ? config.fontSize * 4 : 100;
        this.initialRectH = textHeight+10;

        this.focusRectW = this.initialRectW;
        this.focusRectH = this.initialRectH;

        this.focusRectColor = config.focusRectColor;

        this.tempText = [];
        this.tempText[0] = new Kinetic.Text(config);
        this.currentLine = 0;

        this.maxWidth = 0;
        this.totalLines = 1;

        this.currentWordLetters = 0;
        this.currentWordCursorPos = 0;

        this.noLayerError = new Error('The Kinetic.EditableText shape must be added to a layer!');

        this.noStageError = new Error('The Kinetic.EditableText shape must be added to a stage!');

        this.drawHitFunc = function(canvas) {
            var context = canvas.getContext();

            context.beginPath();
            context.rect(0, 0, this.focusRectW, this.focusRectH);
            context.closePath();
            canvas.fillStroke(this)
        };

        // call super constructor
        Kinetic.Text.call(this, config);
        this.classType = "EditableText";

        this.config = config;

        this.ctrlDown = false;
        this.shiftDown = false;
    };

    /*
     * EditableText methods
     */
    Kinetic.EditableText.prototype = {
        /*
         * function: focus
         * parameters: none
         * summary:
         */
        focus: function() {
            var that = this,
                layer = this.getLayer(),
                stage = this.getStage();

            if (!layer) throw this.noLayerError;
            else if (!stage) throw this.noStageError;
            else {
                this.initKeyHandlers();

                this.hide();

                this.focusRect = new Kinetic.Rect({
                    x: this.x() - 5,
                    y: this.y() - 5,
                    width: this.focusRectW,
                    height: this.totalLines * this.lineHeightPx + 5,
                    stroke: this.focusRectColor,
                    strokeWidth: 1,
                    listening: false
                });

                this.cursorLine = new Kinetic.Line({
                    points: [
                        this.x() + this.width() + 2,
                        this.y(),
                        this.x() + this.width() + 2,
                        this.y() + this.focusRectH - 10
                    ],

                    stroke: 'black'
                });

                this.cursorInterval = setInterval(function() {
                    if (that.cursorLine.isVisible()) that.cursorLine.hide();
                    else that.cursorLine.show();

                    layer.draw()
                }, 500);

                if (stage.getPointerPosition())
                    this.findCursorPosFromClick();

                $.each(this.tempText, function(i, iterTempText) {
                    iterTempText.position({
                        x: that.x(),
                        y: that.y() + i * that.lineHeightPx
                    });

                    layer.add(iterTempText)
                });

                layer.add(this.focusRect);
                layer.add(this.cursorLine);

                layer.draw()
            }
        },

        /*
         * function: findCursorPosFromClick
         * params: Boolean secondary
         * summary:
         */
        findCursorPosFromClick: function() {
            var that = this,
                stage = this.getStage(),
                layer = this.getLayer();

            if (!layer) throw this.noLayerError;
            else if (!stage) throw this.noStageError;
            else {
                var pos = stage.getPointerPosition();

                $.each(this.tempText, function(index, iterTempText) {
                    if ((pos.y < iterTempText.y() + that.lineHeightPx) &&
                        (pos.y > iterTempText.y())) {

                        var prevWordW,
                            curText,
                            iterations = 0,
                            theWord = iterTempText.clone(),
                            wordW = theWord.width(),
                            cursorX = pos.x+ 5,
                            toLeft = true;

                        that.currentLine = index;

                        while (wordW>0 && iterations < 4000) {
                            wordW = theWord.width();
                            curText = theWord.text();
                            theWord.text(curText.substring(0, curText.length-1));
                            iterations++
                        }

                        that.currentWordLetters = iterations == 0 ? 0 : iterations - 1;

                        iterations = 0;
                        theWord = that.tempText[that.currentLine].clone();
                        wordW = theWord.width();

                        while (wordW>0) {
                            prevWordW = wordW;
                            wordW = theWord.width();

                            if (pos.x > that.tempText[that.currentLine].x() + wordW) {
                                // Calculate Diffs and decide whether to go left or right

                                cursorX = that.tempText[that.currentLine].x() + wordW;

                                if ((pos.x - (that.tempText[that.currentLine].x() + wordW)) >
                                    (prevWordW - wordW) / 2 )
                                        toLeft = false;

                                that.currentWordCursorPos = that.currentWordLetters - iterations;
                                break
                            }

                            curText = theWord.text();
                            theWord.text(curText.substring(0, curText.length-1));

                            iterations++
                        }

                        if (!toLeft && that.currentWordCursorPos <
                            that.currentWordLetters)
                                that.currentWordCursorPos++;

                        that.detectCursorPosition()
                    }
                });

                layer.draw();

                // Keep cursor on when moving/writing
                that.cursorLine.show();
                layer.draw();

                clearInterval(that.cursorInterval);
                that.cursorInterval = setInterval(function() {
                    if (that.cursorLine.isVisible()) that.cursorLine.hide();
                    else that.cursorLine.show();

                    layer.draw()
                }, 500)
            }
        },

        detectCursorPosition: function() {
            var theWord = this.tempText[this.currentLine].clone(),
                cursorY = this.tempText[this.currentLine].y(),
                cursorText = theWord.text(),
                cursorLineHeight = this.focusRectH - 10;

            theWord.text(cursorText.substring(0, this.currentWordCursorPos));
            var cursorX = this.tempText[this.currentLine].getX() + theWord.getWidth();

            this.cursorLine.points([cursorX, cursorY, cursorX, cursorY + cursorLineHeight])
        },

        // Check if user's click was inside this text
        checkClick: function() {
            var stage = this.getStage();

            if (!stage) throw this.noStageError;
            else {
                var pos = stage.getPointerPosition();

                return (pos.x > this.getX()) && (pos.x < this.getX() + this.focusRect.getWidth()) &&
                       (pos.y > this.getY()) && (pos.y < this.getY() + this.focusRect.getHeight())
            }
        },

        unfocus: function() {
            var finalText = '',
                body = $("body"),
                layer = this.getLayer();

            if (!layer) throw this.noLayerError;
            else {
                clearInterval(this.cursorInterval);

                $.each(this.tempText, function(index, iterTextLine) {
                    finalText += iterTextLine.getText()+"\n"
                });

                this.setText(finalText);

                this.focusRect.destroy();
                this.cursorLine.destroy();

                $.each(this.tempText, function(index, iterTextLine) {
                    iterTextLine.destroy()
                });

                this.show();

                layer.draw();

                body.off("keydown");
                body.off("keypress");
                body.off("keyup")
            }
        },

        initKeyHandlers: function() {
            var that = this,
                body = $("body");

            //key handlers
            body.on("keydown", function(e) {
                var code = e.charCode || e.keyCode,
                    layer = that.getLayer();

                if ( e.which === 8 ) e.preventDefault();

                if (!layer) throw that.noLayerError;
                else {
                    // Keep cursor on when moving/writing
                    that.cursorLine.show();
                    layer.draw();

                    clearInterval(that.cursorInterval);
                    that.cursorInterval = setInterval(function() {
                        if (that.cursorLine.isVisible()) that.cursorLine.hide();
                        else that.cursorLine.show();

                        layer.draw()
                    }, 500);

                    switch (code) {
                        // 16: Shift
                        case 16:
                            if (!that.shiftDown) that.shiftDown = true;
                            break;

                        // 17: Ctrl
                        case 17:
                            if (!that.ctrlDown) that.ctrlDown = true;
                            break;

                        // 86: 'v' -> Paste
                        case 86:
                            if (that.ctrlDown) {
                                var pasteModal = $("#" + that.config.pasteModal);

                                pasteModal.val('');
                                pasteModal.focus();

                                setTimeout(function() {
                                    var currentTextString = that.tempText[that.currentLine].text(),
                                        textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos),
                                        textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length),
                                        pastedText = $("#" + that.config.pasteModal).val(),
                                        pastedTextLinesArray = pastedText.split(/\r\n|\r|\n/g);

                                    $.each(pastedTextLinesArray, function(index, iterPastedLine) {
                                        if (index > 0) that.newLine();

                                        var newTextString = index > 0 ?
                                                '' : textBeforeCursor + iterPastedLine + (index == pastedTextLinesArray.length - 1 ? textAfterCursor : '');

                                        that.tempText[that.currentLine].text(newTextString);

                                        that.currentWordCursorPos += iterPastedLine.length;
                                        that.currentWordLetters += iterPastedLine.length;

                                        that.detectCursorPosition();

                                        $.each(that.tempText, function(index2, iterTempText) {
                                            if (iterTempText.width() > that.maxWidth) that.maxWidth = iterTempText.width()
                                        });

                                        if (that.maxWidth < that.tempText[that.currentLine].width())
                                            that.maxWidth = that.tempText[that.currentLine].width();

                                        if (that.tempText[that.currentLine].width() >= that.maxWidth)
                                            that.focusRect.width(
                                                80 < that.tempText[that.currentLine].width() ?
                                                    that.tempText[that.currentLine].width() + 20 : 100
                                            );

                                        that.focusRectW = that.focusRect.width();

                                        layer.draw()
                                    })
                                }, 1)
                            }

                            break;

                        // 37: Left Arrow
                        case 37:
                            if (that.currentWordCursorPos !== 0)
                                that.currentWordCursorPos--;
                            else {
                                if (that.currentLine !== 0) {
                                    that.currentLine--;

                                    var prevLineLetterCount = that.tempText[that.currentLine].text().length;

                                    that.currentWordCursorPos = prevLineLetterCount;
                                    that.currentWordLetters = prevLineLetterCount;
                                }
                            }

                            that.detectCursorPosition();

                            layer.draw();

                            break;

                        // 39: Right Arrow
                        case 39:
                            if (that.currentWordCursorPos != that.currentWordLetters)
                                that.currentWordCursorPos++;
                            else {
                                if (that.currentLine !== that.totalLines - 1) {
                                    that.currentLine++;

                                    var nextLineLetterCount = that.tempText[that.currentLine].text().length;

                                    that.currentWordCursorPos = 0;
                                    that.currentWordLetters = nextLineLetterCount;
                                }
                            }

                            that.detectCursorPosition();

                            layer.draw();

                            break;

                        // 38: Up Arrow
                        // 40: Down Arrow
                        case 38: case 40:
                            if (code==38 && that.currentLine==0) return false;
                            if (code==40 && that.currentLine==that.totalLines-1) return false;

                            code == 38 ? that.currentLine-- : that.currentLine++;

                            var pos = {
                                x: that.cursorLine.points()[0].x,
                                y: that.tempText[that.currentLine].y()
                            };

                            // TODO this must be a copy-paste from somewhere...
                            var prevWordW,
                                curText,
                                iterations = 0,
                                theWord = that.tempText[that.currentLine].clone(),
                                wordW = theWord.width(),
                                cursorX = pos.x + 5,
                                toLeft = true;

                            while (wordW>0 && iterations < 4000) {
                                wordW = theWord.width();
                                curText = theWord.text();
                                theWord.text(curText.substring(0, curText.length - 1));
                                iterations++
                            }

                            that.currentWordLetters = iterations == 0 ? 0 : iterations - 1;

                            iterations = 0;
                            wordW = theWord.width();

                            while (wordW>0) {
                                prevWordW = wordW;
                                wordW = theWord.width();

                                if (pos.x > that.tempText[that.currentLine].x() + wordW) {
                                    cursorX = that.tempText[that.currentLine].x() + wordW;

                                    if ((pos.x - (that.tempText[that.currentLine].x() + wordW)) >
                                        (prevWordW - wordW ) / 2)
                                            toLeft = false;

                                    that.currentWordCursorPos = that.currentWordLetters - iterations;

                                    break
                                }

                                curText = theWord.text();
                                theWord.text(curText.substring(0, curText.length - 1));

                                iterations++
                            }
                            // ****

                            if (!toLeft && that.currentWordCursorPos<that.currentWordLetters) that.currentWordCursorPos++;

                            if (that.currentWordCursorPos > that.currentWordLetters) that.currentWordCursorPos = that.currentWordLetters;

                            that.detectCursorPosition();

                            layer.draw();

                            break;

                        // 35: End
                        // 36: Home
                        case 35: case 36:
                            if (code==36) that.currentWordCursorPos = 0;
                            if (code==35) that.currentWordCursorPos = that.currentWordLetters;

                            that.detectCursorPosition();

                            layer.draw();

                            break;

                        // 8: Backspace
                        // 46: Delete
                        case 8: case 46:
                            that.removeChar(code);

                            break;

                        // 13: Enter
                        case 13:
                            if (that.unfocusOnEnter) that.unfocus(e);
                            else {
                                if (that.ctrlDown) {
                                    that.unfocus(e);

                                    that.ctrlDown = false;

                                    focusedText = undefined

                                } else that.newLine()
                            }

                            break;
                    }
                }
            });

            body.on("keyup", function(e) {
                var code = e.charCode || e.keyCode;

                switch (code) {
                    case 16:
                        that.shiftDown = false;
                        break;

                    case 17:
                        that.ctrlDown = false;
                        break;

                    default: break;
                }
            });

            // General text input
            body.on("keypress", function(e) {
                that.addChar(e);

                return false
            });
        },

        newLine: function() {
            var that = this,
                layer = this.getLayer();

            if (!layer) throw this.noLayerError;
            else {
                that.focusRect.height(that.focusRect.height() + that.lineHeightPx);

                that.currentLine++;
                that.totalLines++;

                var newLineIndex = that.totalLines - 1;
                that.tempText[newLineIndex] = new Kinetic.Text(that.config);

                layer.add(that.tempText[newLineIndex]);

                that.tempText[newLineIndex].x(that.x());
                that.tempText[newLineIndex].y(that.y() + newLineIndex * that.lineHeightPx);

                if (that.currentLine < that.totalLines - 1) {
                    for (var i = that.totalLines ; i > that.currentLine+1 ; i--) {
                        that.tempText[i - 1].text(that.tempText[i - 2].text())
                    }
                }

                var currentTextString = that.tempText[that.currentLine - 1].text(),
                    textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos),
                    textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

                that.tempText[that.currentLine - 1].text(textBeforeCursor);
                that.tempText[that.currentLine].text(textAfterCursor);

                that.currentWordCursorPos = 0;
                that.currentWordLetters = textAfterCursor.length;

                that.detectCursorPosition();

                layer.draw()
            }
        },

        addChar: function(e) {
            var that = this,
                layer = this.getLayer();

            if (!layer) throw this.noLayerError;
            else {
                var code = e.charCode || e.keyCode;

                // Ignore all keys handled in keydown.
                if (code == 8 || code == 13 || code == 37 || code == 38 || code == 39 || code == 40) return;

                var theChar = typeof e === 'string' ? e : String.fromCharCode(code);

                var currentTextString = that.tempText[that.currentLine].text();
                var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
                var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

                var newTextString = textBeforeCursor + theChar + textAfterCursor;
                that.tempText[that.currentLine].text(newTextString);

                that.currentWordCursorPos++;
                that.currentWordLetters++;

                if ( typeof e !== 'string' ) that.detectCursorPosition();

                $.each(that.tempText, function(index, iterTempText) {
                    if (iterTempText.width() > that.maxWidth) that.maxWidth = iterTempText.width()
                });

                if (that.maxWidth < that.tempText[that.currentLine].width())
                    that.maxWidth = that.tempText[that.currentLine].width();

                if (that.tempText[that.currentLine].width() >= that.maxWidth)
                    that.focusRect.width(
                        80 < that.tempText[that.currentLine].width() ?
                            that.tempText[that.currentLine].width() + 20 : 100
                    );

                that.focusRectW = that.focusRect.width();

                layer.draw()
            }
        },

        removeChar: function(code) {
            var that = this,
                layer = this.getLayer();

            if (code !== 8 && code !== 46)
                throw new Error('The first argument passed to Kinetic.EditableText.removeChar() must be ' +
                                'the integer 8 (backspace key code) or 46 (delete key code)');
            else if (!layer) throw this.noLayerError;
            else {
                var i,
                    oldWidth = that.tempText[that.currentLine].width(),
                    currentTextString = that.tempText[that.currentLine].text(),
                    deletedText = that.tempText[that.currentLine].text(),
                    deletedTextStart = deletedText.substring(0, code === 8 ? that.currentWordCursorPos - 1 : that.currentWordCursorPos),
                    deletedTextEnd = deletedText.substring(code === 8 ? that.currentWordCursorPos : that.currentWordCursorPos + 1, deletedText.length);

                // Backspace
                if (code==8 && that.currentWordCursorPos == 0) {
                    if (that.currentLine > 0) {
                        var prevLineLettersCount = that.tempText[that.currentLine - 1].text().length,
                            prevLineString = (that.tempText[that.currentLine - 1]) ?
                                that.tempText[that.currentLine - 1].text() : "";

                        that.tempText[that.currentLine - 1].text(prevLineString + currentTextString);

                        that.currentWordLetters += prevLineLettersCount;

                        that.currentWordCursorPos = prevLineLettersCount;

                        that.currentLine--;

                        for (i = that.currentLine + 1 ; i < that.totalLines - 1; i++)
                            that.tempText[i].text(that.tempText[i + 1].text())

                        that.tempText[i].text("");

                        that.focusRect.height(that.focusRect.height() - that.lineHeightPx);

                        that.totalLines--;

                        if (oldWidth >= that.maxWidth) {
                            that.focusRect.width(
                                80 < that.tempText[that.currentLine].width() ?
                                    that.tempText[that.currentLine].width() + 20 : 100
                            );

                            that.maxWidth = that.tempText[that.currentLine].width()
                        }

                        that.detectCursorPosition();

                        layer.draw();

                        return
                    }
                }
                // Delete
                if (code==46 && that.currentWordCursorPos == that.currentWordLetters) {
                    if (that.currentLine < that.totalLines-1) {
                        var nextLineString = (that.tempText[that.currentLine + 1]) ?
                                that.tempText[ that.currentLine + 1].text() : "";

                        that.tempText[that.currentLine].text(currentTextString + nextLineString);

                        that.currentWordLetters += that.tempText[that.currentLine + 1].text().length;

                        for (i = that.currentLine + 1; i < that.totalLines - 1; i++)
                            that.tempText[i].text(that.tempText[i + 1].text())

                        that.tempText[i].text("");

                        that.focusRect.height(that.focusRect.height() - that.lineHeightPx);

                        that.totalLines--;

                        if (oldWidth >= that.maxWidth) {
                            that.focusRect.width(
                                80 < that.tempText[that.currentLine].width() ?
                                    that.tempText[that.currentLine].width() + 20 : 100
                            );

                            that.maxWidth = that.tempText[that.currentLine].width()
                        }

                        layer.draw();

                        return
                    }
                }

                deletedText = deletedTextStart+deletedTextEnd;

                if (code === 8 && that.currentWordCursorPos > 0) that.currentWordCursorPos--;

                that.currentWordLetters--;

                that.tempText[that.currentLine].text(deletedText);

                that.detectCursorPosition();

                $.each(that.tempText, function(index, iterTempText) {
                    if (iterTempText.width() > that.maxWidth) that.maxWidth = iterTempText.width()
                });

                if (oldWidth >= that.maxWidth) {
                    that.focusRect.width(
                        80 < that.tempText[that.currentLine].width() ?
                            that.tempText[that.currentLine].width() + 20 : 100
                    );

                    that.maxWidth = that.tempText[that.currentLine].width()
                }

                that.focusRectW = that.focusRect.width();

                layer.draw()
            }
        },

        backspaceChar: function() { this.removeChar(8) },

        deleteChar: function() { this.removeChar(46) },

        clear: function() {
            var layer = this.getLayer();

            if (!layer) throw this.noLayerError;
            else {
                for (var i = this.totalLines - 1; i > -1; i--) {
                    if (i === 0)
                        this.tempText[i].text("");
                    else {
                        this.tempText[i].destroy();
                        this.tempText.length = i
                    }
                }

                this.focusRectW = this.initialRectW;
                this.focusRectH = this.initialRectH;

                this.focusRect.size({
                    width: this.focusRectW,
                    height: this.focusRectH
                });

                this.currentLine = 0;
                this.totalLines = 1;

                this.maxWidth = 0;

                this.currentWordLetters = 0;
                this.currentWordCursorPos = 0;

                this.detectCursorPosition();

                layer.draw()
            }
        },

        text: function(string) {
            var i;

            if (arguments.length === 0) {
                var text = "";

                for (i = 0; i < this.tempText.length; i++){
                    text += this.tempText[i].text();

                    if (typeof this.tempText[i + 1] !== "undefined" &&
                        this.tempText[i + 1].text() !== '')
                            text += "\n"
                }

                return text
            } else {
                if (typeof string === "string") {
                    this.clear();

                    for (i = 0; i < string.length; i++) {
                        if (/\r\n|\r|\n/g.exec(string[i]))
                            this.newLine();
                        else
                            this.addChar(string[i])
                    }

                } else throw new Error("The first argument passed to Kinetic.EditableText.text() must be a string")
            }
        }
    };

    Kinetic.Util.extend(Kinetic.EditableText, Kinetic.Text);
}

// Define an AMD module
if (typeof define === 'function' && typeof define.amd === 'object')
    define({ init: init });

// Define a CommonJS module
else if (typeof module !== 'undefined' && module.exports)
    module.kineticEditableText = { init: init };

// Define Kinetic.EditableText globally
else init();