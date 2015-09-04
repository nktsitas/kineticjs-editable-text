/*jslint browser: true*/
/**
 * KineticJS EditableText Extension
 * Compatible with KineticJS JavaScript Library v5.1.0
 * Author: Nikos Tsitas
 * Date: June 29 2014
 */

////////////////////
//  EditableText  //
////////////////////

var define = window.define || {};
var module = window.module || {};

// Define Kinetic.EditableText globally or
// Define KineticModule.EditableText if an AMD or CommonJS module loader is detected
function init(KineticModule) {
    var Kinetic = window.Kinetic || KineticModule;

    if (Kinetic === "undefined") {
        throw new Error("Kinetic must be a global variable or passed to init.");
    }

    /**
     * EditableText constructor.  EditableText extends Text
     * @constructor
     * @param {Object} config
     */
    Kinetic.EditableText = function (config) {
        config.name = "EditableText";
        config.fontSize = config.fontSize || 16;
        config.lineHeight = config.lineHeight || 1.3;
        this.focusRectColor = config.focusRectColor || 'black';
        delete config.focusRectColor;
        config.unfocusOnEnter = config.unfocusOnEnter || false;
        config.pasteModal = config.pasteModal || null;

        var textHeight = config.fontSize;
        this.lineHeightPx = config.lineHeight * textHeight;

        this.initialRectW = (100 < config.fontSize * 3) ? config.fontSize * 4 : 100;
        this.initialRectH = textHeight + 10;

        // configure the default text.
        this.defaultText = config.defaultText;
        delete config.defaultText;
        if (this.defaultText && !config.text) {
            config.text = this.defaultText;
        } else if (!config.text) {
            config.text = '';
        }

        var textlines = config.text.split('\n');
        var maxLength = 0,
            i;

        this.totalLines = textlines.length || 1;
        this.currentLine = textlines.length - 1 || 0;
        this.tempText = [];
        this.configTemp = Object.create(config);
        this.configTemp.draggable = false;

        for (i = 0; i < this.totalLines; i++) {
            this.tempText[i] = new Kinetic.Text(this.configTemp);
            this.tempText[i].setText(textlines[i]);

            if (this.tempText[i].width() > maxLength) {
                maxLength = this.tempText[i].width();
            }
        }

        this.focusRectW = maxLength + 20;
        this.focusRectH = this.initialRectH;

        this.maxWidth = 0;

        this.currentWordLetters = this.tempText[this.tempText.length - 1].getText().split(' ').length;
        this.currentWordCursorPos = this.tempText[this.tempText.length - 1].getText().replace(/\n/g, "").length;

        this.noStageError = new Error('The Kinetic.EditableText shape must be added to a stage!');

        this.drawHitFunc = function (canvas) {
            var context = canvas.getContext();

            context.beginPath();
            context.rect(0, 0, this.focusRectW, this.focusRectH);
            context.closePath();
            canvas.fillStroke(this);
        };

        this.config = config;

        // call super constructor
        Kinetic.Text.call(this, config);
        this.classType = "EditableText";
        this.className = "EditableText";

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
        focus: function () {
            var that = this,
                layer = this.getLayer(),
                stage = this.getStage();

            if (!layer) {
                throw this.noLayerError;
            }

            if (!stage) {
                throw this.noStageError;
            }

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


            if (this.defaultText === this.tempText[0].getText().trim()) {
                this.setText("");
                this.tempText[0].setText("");
                this.currentWordCursorPos = 0;
                this.currentWordLetters = 0;
            }

            this.cursorLine = new Kinetic.Line({
                points: [
                    0,
                    this.y(),
                    0,
                    this.y() + this.focusRectH - 10
                ],

                stroke: 'black'
            });

            this.cursorInterval = setInterval(function () {
                if (that.cursorLine.isVisible()) {
                    that.cursorLine.hide();
                } else {
                    that.cursorLine.show();
                }

                layer.draw();
            }, 500);

            $.each(this.tempText, function (i, iterTempText) {
                iterTempText.position({
                    x: that.x(),
                    y: that.y() + i * that.lineHeightPx
                });

                layer.add(iterTempText);
            });

            layer.add(this.focusRect);
            layer.add(this.cursorLine);
            that.detectCursorPosition();
            layer.draw();

        },

        /*
         * function: findCursorPosFromClick
         * params: Boolean secondary
         * summary:
         */
        findCursorPosFromClick: function () {
            var that = this,
                stage = this.getStage(),
                layer = this.getLayer();

            if (!layer) {
                throw this.noLayerError;
            }

            if (!stage) {
                throw this.noStageError;
            }

            var pos = stage.getPointerPosition();

            $.each(this.tempText, function (index, iterTempText) {
                if ((pos.y < iterTempText.y() + that.lineHeightPx) && (pos.y > iterTempText.y())) {

                    var prevWordW,
                        curText,
                        iterations = 0,
                        theWord = iterTempText.clone(),
                        wordW = theWord.width(),
                        toLeft = true;

                    that.currentLine = index;

                    while (wordW > 0 && iterations < 4000) {
                        wordW = theWord.width();
                        curText = theWord.text();
                        theWord.text(curText.substring(0, curText.length - 1));
                        iterations++;
                    }

                    that.currentWordLetters = iterations === 0 ? 0 : iterations - 1;

                    iterations = 0;
                    theWord = that.tempText[that.currentLine].clone();
                    wordW = theWord.width();

                    while (wordW > 0) {
                        prevWordW = wordW;
                        wordW = theWord.width();

                        if (pos.x > that.tempText[that.currentLine].x() + wordW) {
                            // Calculate Diffs and decide whether to go left or right

                            if ((pos.x - (that.tempText[that.currentLine].x() + wordW)) > (prevWordW - wordW) / 2) {
                                toLeft = false;
                            }

                            that.currentWordCursorPos = that.currentWordLetters - iterations;
                            break;
                        }

                        curText = theWord.text();
                        theWord.text(curText.substring(0, curText.length - 1));

                        iterations++;
                    }

                    if (!toLeft && that.currentWordCursorPos < that.currentWordLetters) {
                        that.currentWordCursorPos++;
                    }

                    that.detectCursorPosition();
                }
            });

            layer.draw();

            // Keep cursor on when moving/writing
            that.cursorLine.show();
            layer.draw();

            clearInterval(that.cursorInterval);
            that.cursorInterval = setInterval(function () {
                if (that.cursorLine.isVisible()) {
                    that.cursorLine.hide();
                } else {
                    that.cursorLine.show();
                }

                layer.draw();
            }, 500);
        },

        detectCursorPosition: function () {
            var theWord = this.tempText[this.currentLine].clone(),
                cursorY = this.tempText[this.currentLine].y(),
                cursorText = theWord.text(),
                cursorLineHeight = this.focusRectH - 10;

            theWord.text(cursorText.substring(0, this.currentWordCursorPos));
            var cursorX = this.tempText[this.currentLine].getX() + theWord.getWidth();

            this.cursorLine.points([cursorX + 5, cursorY, cursorX + 5, cursorY + cursorLineHeight]);
        },

        // Check if user's click was inside this text
        checkClick: function () {
            var stage = this.getStage();

            if (!stage) {
                throw this.noStageError;
            }

            var pos = stage.getPointerPosition();

            return (pos.x > this.getX()) && (pos.x < this.getX() + this.focusRect.getWidth()) &&
                (pos.y > this.getY()) && (pos.y < this.getY() + this.focusRect.getHeight());
        },

        unfocus: function () {
            var finalText = '',
                body = $("body"),
                layer = this.getLayer();

            if (!layer) {
                throw this.noLayerError;
            }

            clearInterval(this.cursorInterval);

            /*jslint unparam: true*/
            $.each(this.tempText, function (index, iterTextLine) {
                finalText += iterTextLine.getText() + "\n";
            });

            if (!finalText || finalText.trim() === "") {
                var defaultText = this.defaultText || "";
                this.setText(defaultText);
                this.tempText[0].setText(defaultText);
                this.focusRectW = this.initialRectW;
                this.focusRectH = this.initialRectH;
            } else {
                this.setText(finalText);
            }

            this.focusRect.destroy();
            this.cursorLine.destroy();

            $.each(this.tempText, function (index, iterTextLine) {
                iterTextLine.destroy();
            });

            this.show();

            layer.draw();

            body.off("keydown");
            body.off("keypress");
            body.off("keyup");
        },

        initKeyHandlers: function () {
            var that = this,
                body = $("body");

            //key handlers
            body.on("keydown", function (e) {
                var code = e.charCode || e.keyCode,
                    layer = that.getLayer();

                if (e.which === 8) {
                    e.preventDefault();
                }

                if (!layer) {
                    throw that.noLayerError;
                }

                // Keep cursor on when moving/writing
                that.cursorLine.show();
                layer.draw();

                clearInterval(that.cursorInterval);
                that.cursorInterval = setInterval(function () {
                    if (that.cursorLine.isVisible()) {
                        that.cursorLine.hide();
                    } else {
                        that.cursorLine.show();
                    }

                    layer.draw();
                }, 500);

                switch (code) {
                    // 16: Shift
                case 16:
                    if (!that.shiftDown) {
                        that.shiftDown = true;
                    }

                    break;

                    // 17: Ctrl
                case 17:
                    if (!that.ctrlDown) {
                        that.ctrlDown = true;
                    }

                    break;

                    // 86: 'v' -> Paste
                case 86:
                    if (that.ctrlDown) {
                        var pasteModal = $("#" + that.config.pasteModal);

                        pasteModal.val('');
                        pasteModal.focus();

                        setTimeout(function () {
                            var pastedText = $("#" + that.config.pasteModal).val(),
                                pastedLines = pastedText.split(/\r\n|\r|\n/g),
                                pastedLastLineLength = pastedLines[pastedLines.length - 1].length,
                                previousCursorPos = that.currentWordCursorPos,
                                previousLine = that.currentLine,
                                cursorLineText = that.tempText[that.currentLine].text(),
                                textBeforeCursor = cursorLineText.substring(0, previousCursorPos),
                                textAfterCursor = cursorLineText.substring(previousCursorPos, cursorLineText.length),
                                lines = "",
                                i;

                            for (i = 0; i < that.tempText.length; i++) {
                                if (i === that.currentLine) {
                                    lines += textBeforeCursor + pastedText + textAfterCursor;
                                } else {
                                    lines += that.tempText[i].text();
                                }

                                if (that.tempText[i + 1] !== "undefined") {
                                    lines += "\n";
                                }
                            }

                            that.text(lines);

                            if (that.currentLine !== previousLine) {
                                that.currentWordCursorPos = pastedLastLineLength;
                            } else {
                                that.currentWordCursorPos = previousCursorPos + pastedLastLineLength;
                            }

                            that.currentLine = previousLine + pastedLines.length - 1;

                            that.detectCursorPosition();

                            layer.draw();
                        }, 0);
                    }

                    break;

                    // 37: Left Arrow
                case 37:
                    if (that.currentWordCursorPos !== 0) {
                        that.currentWordCursorPos--;
                    } else {
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
                    if (that.currentWordCursorPos !== that.currentWordLetters) {
                        that.currentWordCursorPos++;
                    } else {
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
                case 38:
                case 40:
                    // FIX-ME: if (code === 38) ? code isn't 40? o_O
                    if (code === 38 && that.currentLine === 0) {
                        return false;
                    }

                    if (code === 40 && that.currentLine === that.totalLines - 1) {
                        return false;
                    }

                    if (code === 38) {
                        that.currentLine--;
                    } else {
                        that.currentLine++;
                    }

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
                        toLeft = true;

                    while (wordW > 0 && iterations < 4000) {
                        wordW = theWord.width();
                        curText = theWord.text();
                        theWord.text(curText.substring(0, curText.length - 1));
                        iterations++;
                    }

                    that.currentWordLetters = iterations === 0 ? 0 : iterations - 1;

                    iterations = 0;
                    wordW = theWord.width();

                    while (wordW > 0) {
                        prevWordW = wordW;
                        wordW = theWord.width();

                        if (pos.x > that.tempText[that.currentLine].x() + wordW) {

                            if ((pos.x - (that.tempText[that.currentLine].x() + wordW)) > (prevWordW - wordW) / 2) {
                                toLeft = false;
                            }

                            that.currentWordCursorPos = that.currentWordLetters - iterations;

                            break;
                        }

                        curText = theWord.text();
                        theWord.text(curText.substring(0, curText.length - 1));

                        iterations++;
                    }
                    // ****

                    if (!toLeft && that.currentWordCursorPos < that.currentWordLetters) {
                        that.currentWordCursorPos++;
                    }

                    if (that.currentWordCursorPos > that.currentWordLetters) {
                        that.currentWordCursorPos = that.currentWordLetters;
                    }

                    that.detectCursorPosition();

                    layer.draw();

                    break;

                    // 35: End
                    // 36: Home
                case 35:
                case 36:
                    // FIX-ME why is done this verification?
                    if (code === 36) {
                        that.currentWordCursorPos = 0;
                    }

                    if (code === 35) {
                        that.currentWordCursorPos = that.currentWordLetters;
                    }

                    that.detectCursorPosition();

                    layer.draw();

                    break;

                    // 8: Backspace
                    // 46: Delete
                case 8:
                case 46:
                    that.removeChar(code);

                    break;

                    // 13: Enter
                case 13:
                    if (that.unfocusOnEnter) {
                        that.unfocus(e);
                    } else {
                        if (that.ctrlDown) {
                            that.unfocus(e);
                            that.ctrlDown = false;
                        } else {
                            that.newLine();
                        }
                    }

                    break;
                }
            });

            body.on("keyup", function (e) {
                var code = e.charCode || e.keyCode;

                switch (code) {
                case 16:
                    that.shiftDown = false;
                    break;

                case 17:
                    that.ctrlDown = false;
                    break;

                default:
                    break;
                }
            });

            // General text input
            body.on("keypress", function (e) {
                that.addChar(e);

                return false;
            });
        },

        toObject: function () {
            var type = Kinetic.Util,
                obj = {},
                attrs = this.getAttrs(),
                key,
                val,
                getter,
                defaultValue;

            obj.attrs = {};

            // serialize only attributes that are not function, image, DOM, or objects with methods
            for (key in attrs) {

                if (attrs.hasOwnProperty(key)) {
                    val = attrs[key];
                    if (!type._isFunction(val) && !type._isElement(val) && !(type._isObject(val) && type._hasMethods(val))) {
                        getter = this[key];
                        // remove attr value so that we can extract the default value from the getter
                        delete attrs[key];
                        defaultValue = getter ? getter.call(this) : null;
                        // restore attr value
                        attrs[key] = val;

                        if (key === 'text') {
                            obj.attrs[key] = defaultValue.replace(/\n$/g, '');
                        } else if (val) {
                            obj.attrs[key] = val;
                        } else {
                            obj.attrs[key] = defaultValue;
                        }
                    }
                }
            }

            obj.className = this.getClassName();
            return obj;
        },

        newLine: function (quiet) {
            var that = this,
                layer = this.getLayer();

            if (!layer) {
                throw this.noLayerError;
            }

            that.focusRect.height(that.focusRect.height() + that.lineHeightPx);

            that.currentLine++;
            that.totalLines++;

            var newLineIndex = that.totalLines - 1;
            that.tempText[newLineIndex] = new Kinetic.Text(that.configTemp);

            layer.add(that.tempText[newLineIndex]);

            that.tempText[newLineIndex].x(that.x());
            that.tempText[newLineIndex].y(that.y() + newLineIndex * that.lineHeightPx);

            if (that.currentLine < that.totalLines - 1) {
                var i;
                for (i = that.totalLines; i > that.currentLine + 1; i--) {
                    that.tempText[i - 1].text(that.tempText[i - 2].text());
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

            layer.draw();

            if (quiet !== true) {
                that.fire('change');
            }
        },

        addChar: function (e, quiet) {
            var that = this,
                layer = this.getLayer();

            if (!layer) {
                throw this.noLayerError;
            }

            var code = e.charCode || e.keyCode;

            // Ignore all keys handled in keydown.
            if (code === 8 || code === 13 || code === 37 || code === 38 || code === 39 || code === 40) {
                return;
            }

            var theChar = typeof e === 'string' ? e : String.fromCharCode(code);

            var currentTextString = that.tempText[that.currentLine].text();
            var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
            var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

            var newTextString = textBeforeCursor + theChar + textAfterCursor;
            that.tempText[that.currentLine].text(newTextString);

            that.currentWordCursorPos++;
            that.currentWordLetters++;

            if (typeof e !== 'string') {
                that.detectCursorPosition();
            }

            /*jslint unparam: true*/
            $.each(that.tempText, function (index, iterTempText) {
                if (iterTempText.width() > that.maxWidth) {
                    that.maxWidth = iterTempText.width();
                }
            });

            if (that.maxWidth < that.tempText[that.currentLine].width()) {
                that.maxWidth = that.tempText[that.currentLine].width();
            }

            if (that.tempText[that.currentLine].width() >= that.maxWidth) {
                that.focusRect.width(
                    80 < that.tempText[that.currentLine].width() ? that.tempText[that.currentLine].width() + 20 : 100
                );
            }

            that.focusRectW = that.focusRect.width();

            layer.draw();

            if (quiet !== true) {
                that.fire('change');
            }
        },

        removeChar: function (code, quiet) {
            var that = this,
                layer = this.getLayer();

            if (code !== 8 && code !== 46) {
                throw new Error('The first argument passed to Kinetic.EditableText.removeChar() must be ' +
                    'the integer 8 (backspace key code) or 46 (delete key code)');
            }

            if (!layer) {
                throw this.noLayerError;
            }


            var i,
                oldWidth = that.tempText[that.currentLine].width(),
                currentTextString = that.tempText[that.currentLine].text(),
                deletedText = that.tempText[that.currentLine].text(),
                deletedTextStart = deletedText.substring(0, code === 8 ? that.currentWordCursorPos - 1 : that.currentWordCursorPos),
                deletedTextEnd = deletedText.substring(code === 8 ? that.currentWordCursorPos : that.currentWordCursorPos + 1, deletedText.length);

            // Backspace
            if (code === 8 && that.currentWordCursorPos === 0) {
                if (that.currentLine > 0) {
                    var prevLineLettersCount = that.tempText[that.currentLine - 1].text().length,
                        prevLineString = (that.tempText[that.currentLine - 1]) ? that.tempText[that.currentLine - 1].text() : "";

                    that.tempText[that.currentLine - 1].text(prevLineString + currentTextString);

                    that.currentWordLetters += prevLineLettersCount;

                    that.currentWordCursorPos = prevLineLettersCount;

                    that.currentLine--;

                    for (i = that.currentLine + 1; i < that.totalLines - 1; i++) {
                        that.tempText[i].text(that.tempText[i + 1].text());
                    }

                    console.log(that.tempText[i].text());

                    that.tempText[i].text("");

                    that.tempText[i].destroy();

                    that.tempText.splice(i);

                    that.focusRect.height(that.focusRect.height() - that.lineHeightPx);

                    that.totalLines--;

                    if (oldWidth >= that.maxWidth) {
                        that.focusRect.width(
                            80 < that.tempText[that.currentLine].width() ? that.tempText[that.currentLine].width() + 20 : 100
                        );
                        that.maxWidth = that.tempText[that.currentLine].width();
                    }

                    that.detectCursorPosition();

                    layer.draw();

                    return;
                }
            }
            // Delete
            if (code === 46 && that.currentWordCursorPos === that.currentWordLetters) {
                if (that.currentLine < that.totalLines - 1) {
                    var nextLineString = (that.tempText[that.currentLine + 1]) ? that.tempText[that.currentLine + 1].text() : "";

                    that.tempText[that.currentLine].text(currentTextString + nextLineString);

                    that.currentWordLetters += that.tempText[that.currentLine + 1].text().length;

                    for (i = that.currentLine + 1; i < that.totalLines - 1; i++) {
                        that.tempText[i].text(that.tempText[i + 1].text());
                    }

                    that.tempText[i].text("");

                    that.focusRect.height(that.focusRect.height() - that.lineHeightPx);

                    that.totalLines--;

                    if (oldWidth >= that.maxWidth) {
                        that.focusRect.width(
                            80 < that.tempText[that.currentLine].width() ? that.tempText[that.currentLine].width() + 20 : 100
                        );

                        that.maxWidth = that.tempText[that.currentLine].width();
                    }

                    layer.draw();

                    return;
                }
            }

            deletedText = deletedTextStart + deletedTextEnd;

            if (code === 8 && that.currentWordCursorPos > 0) {
                that.currentWordCursorPos--;
            }

            that.currentWordLetters--;

            that.tempText[that.currentLine].text(deletedText);

            that.detectCursorPosition();

            /*jslint unparam: true*/
            $.each(that.tempText, function (index, iterTempText) {
                if (iterTempText.width() > that.maxWidth) {
                    that.maxWidth = iterTempText.width();
                }
            });

            if (oldWidth >= that.maxWidth) {
                that.focusRect.width(
                    80 < that.tempText[that.currentLine].width() ? that.tempText[that.currentLine].width() + 20 : 100
                );

                that.maxWidth = that.tempText[that.currentLine].width();
            }

            that.focusRectW = that.focusRect.width();

            layer.draw();

            if (quiet !== true) {
                that.fire('change');
            }

        },

        backspaceChar: function () {
            this.removeChar(8);
        },

        deleteChar: function () {
            this.removeChar(46);
        },

        clear: function (quiet) {
            var layer = this.getLayer();
            var i;

            if (!layer) {
                throw this.noLayerError;
            }

            for (i = this.totalLines - 1; i > -1; i--) {
                if (i === 0) {
                    this.tempText[i].text("");
                } else {
                    this.tempText[i].destroy();
                    this.tempText.length = i;
                }
            }

            this.focusRectW = this.initialRectW;
            this.focusRectH = this.initialRectH;

            this.focusRect.width = this.focusRectW;
            this.focusRect.height = this.focusRectH;

            this.currentLine = 0;
            this.totalLines = 1;

            this.maxWidth = 0;

            this.currentWordLetters = 0;
            this.currentWordCursorPos = 0;

            this.detectCursorPosition();

            layer.draw();

            if (quiet !== true) {
                this.fire('change');
            }
        },

        text: function (string, quiet) {
            var i;

            if (arguments.length === 0) {
                var text = "";

                for (i = 0; i < this.tempText.length; i++) {
                    text += this.tempText[i].text();

                    if (this.tempText[i + 1] !== "undefined") {
                        text += "\n";
                    }
                }

                return text;
            }

            if (typeof string === "string") {
                this.clear(true);

                for (i = 0; i < string.length; i++) {
                    if (/\r\n|\r|\n/g.exec(string[i])) {
                        this.newLine(true);
                    } else {
                        this.addChar(string[i], true);
                    }
                }

                this.detectCursorPosition();

            } else {
                throw new Error("The first argument passed to Kinetic.EditableText.text() must be a string");
            }

            if (quiet !== true) {
                this.fire('change');
            }
        }
    };

    Kinetic.Util.extend(Kinetic.EditableText, Kinetic.Text);
}

// Define an AMD module
var defineType = typeof define;
var defineAmdType = typeof define.amd;

if (defineType === 'function' && defineAmdType === 'object') {
    define({
        init: init
    });
} else if (module !== 'undefined' && module.exports) {
    // Define a CommonJS module
    module.kineticEditableText = {
        init: init
    };
} else {
    // Define Kinetic.EditableText globally
    init();
}