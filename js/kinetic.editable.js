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

    if (typeof Kinetic === "undefined") {
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
        config.focusRectColor = config.focusRectColor || 'black';
        config.unfocusOnEnter = config.unfocusOnEnter || false;
        config.pasteModal = config.pasteModal || null;

        if (config.focusLayer==undefined) {
            throw new Error("Please Provide a Focus Layer (config.focusLayer).");
        }

        var textHeight = config.fontSize;
        this.lineHeightPx = config.lineHeight * textHeight;

        // focus rectangle - 'TextBox'
        this.focusRectW = (100<config.fontSize*3)?config.fontSize*4:100;
        this.focusRectH = textHeight+10;
        this.initialRectH = textHeight+10;
        this.focusRectColor = config.focusRectColor;
        this.focusLayer = config.focusLayer;

        this.tempText = Array();
        this.tempText[0] = new Kinetic.Text(config);
        this.currentLine = 0;

        this.maxWidth = 0;
        this.totalLines = 1;

        this.stage = config.stage;

        this.currentWordLetters = 0;
        this.currentWordCursorPos = 0;

        this.unfocusedOnce=false;

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
            try {
                this.staticLayer = this.getLayer();
            }
            catch (e) {
                throw new Error("Add to a layer first, before focus");
            }

            this.initKeyHandlers();

            this.hide();
            this.staticLayer.draw();

            this.focusRect = new Kinetic.Rect({
                x: this.getX()-5,
                y: this.getY()-5,
                width: this.focusRectW,
                height: this.totalLines * this.lineHeightPx + 5,
                stroke: this.focusRectColor,
                strokeWidth: 1,
                listening: false
            });

            this.cursorLine = new Kinetic.Line({
                points: [this.getX() + this.getWidth() + 2,this.getY(),this.getX() + this.getWidth() + 2,this.getY()+this.focusRectH-10],
                stroke: 'black'
            });

            var that = this;

            this.cursorInterval = setInterval(function() {
                if (that.cursorLine.isVisible()) that.cursorLine.hide();
                else that.cursorLine.show();

                that.focusLayer.draw();
            }, 500);

            this.findCursorPosFromClick(false);

            this.focusLayer.add(this.focusRect);
            this.focusLayer.add(this.cursorLine);

            this.focusLayer.draw();

            var obj = this.stage.getIntersection(this.stage.getPointerPosition());
        },

        /*
         * function: findCursorPosFromClick
         * params: Boolean secondary
         * summary:
         */
        findCursorPosFromClick: function(secondary) {
            var that = this;

            $.each(this.tempText, function(index, iterTempText) {
                iterTempText.setX(that.getX());
                iterTempText.setY(that.getY() + index*that.lineHeightPx);

                // secondary check
                if (!secondary) that.focusLayer.add(iterTempText);

                var pos = that.stage.getPointerPosition();

                // Checking Coords
                if ( 	(pos.y < iterTempText.getY() + that.lineHeightPx) &&
                    (pos.y > iterTempText.getY())  )
                {
                    // Match
                    that.currentLine = index;

                    var letterFound = false;
                    var iterations = 0
                    var theWord = iterTempText.clone();
                    var wordW=theWord.getWidth();
                    var cursorX = pos.x+5;

                    while (wordW>0 && iterations < 4000) {
                        wordW = theWord.getWidth();
                        curText = theWord.getText();
                        theWord.setText(curText.substring(0,curText.length-1));
                        iterations++;
                    }

                    that.currentWordLetters = iterations==0?0:iterations-1;

                    iterations = 0;
                    theWord = that.tempText[that.currentLine].clone();
                    wordW=theWord.getWidth();

                    var prevWordW;
                    var toLeft=true;

                    while (wordW>0) {
                        prevWordW = wordW;
                        wordW = theWord.getWidth();

                        if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
                            // Match
                            // Calculate Diffs and decide whether to go left or right
                            cursorX = that.tempText[that.currentLine].getX() + wordW;

                            if ( (pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW-wordW)/2 ) toLeft=false;

                            that.currentWordCursorPos = that.currentWordLetters - iterations;
                            break;
                        }

                        curText = theWord.getText();
                        theWord.setText(curText.substring(0,curText.length-1));

                        iterations++;
                    }

                    if (!toLeft && that.currentWordCursorPos<that.currentWordLetters) that.currentWordCursorPos++;

                    that.detectCursorPosition();
                }
            });

            that.focusLayer.draw();

            // Keep cursor on when moving/writing
            that.cursorLine.show();
            that.focusLayer.draw();

            clearInterval(that.cursorInterval);
            that.cursorInterval = setInterval(function() {
                if (that.cursorLine.isVisible()) that.cursorLine.hide();
                else that.cursorLine.show();

                that.focusLayer.draw();
            }, 500);
            // -----
        },

        countLetters: function(theWord) {
            var iterations = 0;
            var wordW=theWord.getWidth();

            while (wordW>0 && iterations < 4000) {
                wordW = theWord.getWidth();
                curText = theWord.getText();
                theWord.setText(curText.substring(0,curText.length-1));
                iterations++;
            }

            return iterations==0?0:iterations-1;
        },

        detectCursorPosition: function() {
            var theWord = this.tempText[this.currentLine].clone();
            var wordW = theWord.getWidth();
            var cursorX = this.cursorLine.getX();
            var curText = theWord.getText();

            theWord.setText(curText.substring(0,this.currentWordCursorPos));
            cursorX = this.tempText[this.currentLine].getX() + theWord.getWidth();

            var cursorLineX = cursorX;
            var cursorLineY = this.tempText[this.currentLine].getY();
            var cursorLineHeight = this.focusRectH-10;

            this.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
        },

        // Check if user's click was inside this text
        checkClick: function() {
            var pos = this.stage.getPointerPosition();

            return (
                (pos.x > this.getX()) && (pos.x < this.getX() + this.focusRect.getWidth()) &&
                (pos.y > this.getY()) && (pos.y < this.getY() + this.focusRect.getHeight())
                );
        },

        unfocus: function(e) {
            clearInterval(this.cursorInterval);

            var finalText = '';

            $.each(this.tempText, function(index, iterTextLine) {
                finalText += iterTextLine.getText()+"\n";
            });

            this.setText(finalText);

            this.focusRect.destroy();
            this.cursorLine.destroy();
            //this.currentText.destroy();

            //this.tempText.destroy();
            $.each(this.tempText, function(index, iterTextLine) {
                iterTextLine.destroy();
            });

            //this.focusLayer.removeChildren();
            this.focusLayer.draw();

            this.show();
            this.staticLayer.draw();

            if (this.maxWidth == 0) this.destroy();

            $("body").off("keydown");
            $("body").off("keypress");
            $("body").off("keyup");

            this.fire("unfocusText");

            this.unfocusedOnce = true;
        },

        initKeyHandlers: function() {
            var that = this;

            //key handlers
            $("body").on("keydown", function(e) {
                var code = e.charCode || e.keyCode;

                // Keep cursor on when moving/writing
                that.cursorLine.show();
                that.focusLayer.draw();

                clearInterval(that.cursorInterval);
                that.cursorInterval = setInterval(function() {
                    if (that.cursorLine.isVisible()) that.cursorLine.hide();
                    else that.cursorLine.show();

                    that.focusLayer.draw();
                }, 500);
                // -----

                switch (code) {
                    // 16: Shift
                    case 16:
                        if (that.shiftDown) break;
                        that.shiftDown = true;
                        break;
                    // 17: Ctrl
                    case 17:
                        if (that.ctrlDown) break;
                        that.ctrlDown = true;
                        break;
                    // 86: 'v' -> Paste
                    case 86:
                        if (that.ctrlDown) {
                            $("#"+that.config.pasteModal).val('');
                            $("#"+that.config.pasteModal).focus();

                            setTimeout(function() {
                                var currentTextString = that.tempText[that.currentLine].getText();
                                var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
                                var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

                                var pastedText = $("#"+that.config.pasteModal).val();

                                var pastedTextLinesArray = pastedText.split(/\r\n|\r|\n/g);

                                $.each(pastedTextLinesArray, function(index, iterPastedLine) {
                                    if (index > 0) that.newLine();

                                    var newTextString = ((index > 0)?'':textBeforeCursor) + iterPastedLine + ((index == pastedTextLinesArray.length-1)?textAfterCursor:'');
                                    that.tempText[that.currentLine].setText(newTextString);

                                    that.currentWordCursorPos+=iterPastedLine.length;
                                    that.currentWordLetters+=iterPastedLine.length;

                                    that.detectCursorPosition();

                                    $.each(that.tempText, function(index2, iterTempText) {
                                        if (iterTempText.getWidth() > that.maxWidth) that.maxWidth = iterTempText.getWidth();
                                    });

                                    if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
                                        that.maxWidth = that.tempText[that.currentLine].getWidth();
                                    }

                                    if (that.tempText[that.currentLine].getWidth() >= that.maxWidth) {
                                        that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
                                    }

                                    that.focusRectW = that.focusRect.getWidth();
                                    that.focusLayer.draw();
                                })
                            }, 1);
                        }

                        break;
                    // 37: Left Arrow
                    // 39: Right Arrow
                    case 37: case 39:
                    if (code==37 && that.currentWordCursorPos == 0) {

                        if (that.currentLine == 0) return false;

                        that.currentLine--;

                        var theWord = that.tempText[that.currentLine].clone();
                        var prevLineLetterCount = that.countLetters(theWord);

                        that.currentWordCursorPos = prevLineLetterCount;
                        that.currentWordLetters = prevLineLetterCount;

                        that.detectCursorPosition();

                        that.focusLayer.draw();

                        return false;
                    }
                    if (code==39 && that.currentWordCursorPos == that.currentWordLetters) {

                        if (that.currentLine==that.totalLines-1) return false;

                        that.currentLine++;

                        var theWord = that.tempText[that.currentLine].clone();
                        var nextLineLetterCount = that.countLetters(theWord);

                        that.currentWordCursorPos = 0;
                        that.currentWordLetters = nextLineLetterCount;

                        that.detectCursorPosition();

                        that.focusLayer.draw();

                        return false;
                    }

                    code==37?that.currentWordCursorPos--:that.currentWordCursorPos++;
                    //code==37?console.log("left"):console.log("right");

                    that.detectCursorPosition();

                    that.focusLayer.draw();

                    return false;
                    break;
                    // 38: Up Arrow
                    // 40: Down Arrow
                    case 38: case 40:
                    // code==38?console.log("up"):console.log("down");

                    if (code==38 && that.currentLine==0) return false;
                    if (code==40 && that.currentLine==that.totalLines-1) return false;

                    code==38?that.currentLine--:that.currentLine++;

                    var pos = {
                        x: that.cursorLine.getPoints()[0].x,
                        y: that.tempText[that.currentLine].getY(),
                    }

                    // TODO this must be a copy-paste from somewhere...
                    var iterations = 0
                    var theWord = that.tempText[that.currentLine].clone();
                    var wordW=theWord.getWidth();
                    var cursorX = pos.x+5;

                    while (wordW>0 && iterations < 4000) {
                        wordW = theWord.getWidth();
                        curText = theWord.getText();
                        theWord.setText(curText.substring(0,curText.length-1));
                        iterations++;
                    }

                    that.currentWordLetters = iterations==0?0:iterations-1;

                    iterations = 0
                    theWord = that.tempText[that.currentLine].clone();
                    wordW=theWord.getWidth();

                    var prevWordW;
                    var toLeft=true;

                    while (wordW>0) {
                        prevWordW = wordW;
                        wordW = theWord.getWidth();

                        if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
                            cursorX = that.tempText[that.currentLine].getX() + wordW;

                            if ( (pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW-wordW)/2 ) toLeft=false;

                            that.currentWordCursorPos = that.currentWordLetters - iterations
                            break;
                        }

                        curText = theWord.getText();
                        theWord.setText(curText.substring(0,curText.length-1));

                        iterations++;
                    }
                    // ****

                    if (!toLeft && that.currentWordCursorPos<that.currentWordLetters) that.currentWordCursorPos++;

                    if (that.currentWordCursorPos > that.currentWordLetters) that.currentWordCursorPos = that.currentWordLetters;

                    that.detectCursorPosition();

                    that.focusLayer.draw();

                    return false;
                    break;
                    // 35: End
                    // 36: Home
                    case 35: case 36:
                    // code==35?console.log("end"):console.log("home");

                    if (code==36) that.currentWordCursorPos = 0;
                    if (code==35) that.currentWordCursorPos = that.currentWordLetters;

                    that.detectCursorPosition();

                    that.focusLayer.draw();
                    return false;
                    break;
                    // 8: Backspace
                    // 46: Delete
                    case 8: case 46:
                    // if (code==8) console.log("backspace");

                    that.removeChar(code);

                    return false;

                    break;
                    // 13: Enter
                    case 13:

                        if (that.unfocusOnEnter) that.unfocus(e);
                        else {
                            if (that.ctrlDown) {
                                that.unfocus(e);
                                that.ctrlDown=false;
                                focusedText = undefined;
                            }
                            else {
                                that.newLine();
                            }
                        }

                        return false;

                        break;
                }

                return true;
            });

            $("body").on("keyup", function(e) {
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
            $("body").on("keypress", function(e) {
                that.addChar(e);

                return false
            });
        },

        newLine: function() {
            var that = this;

            that.focusRect.setHeight(that.focusRect.getHeight() + that.lineHeightPx);

            that.currentLine++;
            that.totalLines++;

            var newLineIndex = that.totalLines - 1;
            that.tempText[newLineIndex] = new Kinetic.Text(that.config);

            that.focusLayer.add(that.tempText[newLineIndex]);

            that.tempText[newLineIndex].setX(that.getX());
            that.tempText[newLineIndex].setY(that.getY() + newLineIndex*that.lineHeightPx);

            if (that.currentLine < that.totalLines-1) {
                for (i = that.totalLines ; i > that.currentLine+1 ; i--) {
                    console.log("line: "+i);

                    that.tempText[i-1].setText(that.tempText[i-2].getText());
                }
            }

            // ---
            var currentTextString = that.tempText[that.currentLine-1].getText();
            var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
            var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

            that.tempText[that.currentLine-1].setText(textBeforeCursor);
            that.tempText[that.currentLine].setText(textAfterCursor);
            // ---

            that.currentWordCursorPos = 0;
            that.currentWordLetters = textAfterCursor.length;

            that.detectCursorPosition();

            that.focusLayer.draw();
        },

        addChar: function(e) {
            var that = this;

            var code = e.charCode || e.keyCode;

            // console.log("keypress: "+code);

            // Ignore all keys handled in keydown above.
            if (code == 8 || code == 13 || code == 37 || code == 38 || code == 39 || code == 40) return;

            var theChar = typeof e === 'string' ? e : String.fromCharCode(code);

            var currentTextString = that.tempText[that.currentLine].getText();
            var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
            var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);

            var newTextString = textBeforeCursor + theChar + textAfterCursor;
            that.tempText[that.currentLine].setText(newTextString);

            that.currentWordCursorPos++;
            that.currentWordLetters++;

            if ( typeof e !== 'string' ) that.detectCursorPosition();

            $.each(that.tempText, function(index, iterTempText) {
                if (iterTempText.getWidth() > that.maxWidth) that.maxWidth = iterTempText.getWidth();
            });

            if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
                that.maxWidth = that.tempText[that.currentLine].getWidth();
            }

            if (that.tempText[that.currentLine].getWidth() >= that.maxWidth) {
                that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
            }

            that.focusRectW = that.focusRect.getWidth();

            that.focusLayer.draw()
        },

        removeChar: function(code) {
            var that = this;

            if (code === "backspace") code = 8;
            else if (code === "delete") code = 46;
            else if ( typeof code !== "number")
                throw new Error('The first argument passed to Kinetic.EditableText.removeChar() must be ' +
                    '"backspace" (string), "delete" (string), or a character code (integer)');

            // Backspace
            if (code==8 && that.currentWordCursorPos == 0) {

                if (that.currentLine > 0) {
                    var currentTextString = that.tempText[that.currentLine].getText();
                    var prevLineString = (that.tempText[that.currentLine-1])?that.tempText[that.currentLine-1].getText():"";

                    var prevLineLettersCount = that.countLetters(that.tempText[that.currentLine-1].clone());

                    that.tempText[that.currentLine-1].setText(prevLineString + currentTextString);

                    that.currentWordLetters += prevLineLettersCount;
                    that.currentLine--;
                    that.currentWordCursorPos = prevLineLettersCount;

                    for (i = that.currentLine+1 ; i < that.totalLines-1 ; i++) {
                        that.tempText[i].setText(that.tempText[i+1].getText());
                    }

                    that.tempText[i].setText("");
                    that.focusRect.setHeight(that.focusRect.getHeight() - that.lineHeightPx);
                    that.totalLines--;

                    var oldWidth = that.tempText[that.currentLine].getWidth();
                    if (oldWidth >= that.maxWidth) {
                        that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
                        that.maxWidth = that.tempText[that.currentLine].getWidth();
                    }

                    that.detectCursorPosition();
                    that.focusLayer.draw();
                }
            }
            // Delete
            if (code==46 && that.currentWordCursorPos == that.currentWordLetters) {

                if (that.currentLine < that.totalLines-1) {
                    var currentTextString = that.tempText[that.currentLine].getText();
                    var nextLineString = (that.tempText[that.currentLine+1])?that.tempText[that.currentLine+1].getText():"";

                    that.tempText[that.currentLine].setText(currentTextString + nextLineString);

                    var nextLineLettersCount = that.countLetters(that.tempText[that.currentLine+1].clone());

                    that.currentWordLetters += nextLineLettersCount;

                    for (i = that.currentLine+1 ; i < that.totalLines-1 ; i++) {
                        that.tempText[i].setText(that.tempText[i+1].getText());
                    }

                    that.tempText[i].setText("");
                    that.focusRect.setHeight(that.focusRect.getHeight() - that.lineHeightPx);
                    that.totalLines--;

                    var oldWidth = that.tempText[that.currentLine].getWidth();
                    if (oldWidth >= that.maxWidth) {
                        that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
                        that.maxWidth = that.tempText[that.currentLine].getWidth();
                    }

                    that.focusLayer.draw();
                }
            }

            var deletedText = that.tempText[that.currentLine].getText();
            var deletedTextStart = deletedText.substring(0,code === 8?that.currentWordCursorPos-1:that.currentWordCursorPos);
            var deletedTextEnd = deletedText.substring(code === 8?that.currentWordCursorPos:that.currentWordCursorPos+1,deletedText.length);
            deletedText = deletedTextStart+deletedTextEnd;

            if (code === 8 && that.currentWordCursorPos > 0) that.currentWordCursorPos--;
            that.currentWordLetters--;

            var oldWidth = that.tempText[that.currentLine].getWidth();
            that.tempText[that.currentLine].setText(deletedText);

            that.detectCursorPosition();

            $.each(that.tempText, function(index, iterTempText) {
                if (iterTempText.getWidth() > that.maxWidth) that.maxWidth = iterTempText.getWidth();
            });

            if (oldWidth >= that.maxWidth) {
                that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
                that.maxWidth = that.tempText[that.currentLine].getWidth();
            }

            that.focusRectW = that.focusRect.getWidth();

            that.focusLayer.draw();
        },

        text: function(string) {
            var i;

            if (arguments.length === 0) {
                var text = "";

                for (i = 0; i < this.tempText.length; i++){
                    text += this.tempText[i].text();

                    if (typeof this.tempText[i + 1] !== "undefined" && this.tempText[i + 1].text() !== '') text += "\n"
                }

                return text
            } else {
                if (typeof string === "string") {
                    var lastLine = this.tempText.length - 1;

                    this.currentLine = lastLine;
                    this.currentWordCursorPos = this.tempText[lastLine].text().length;

                    while (this.currentLine !== 0 || this.currentWordCursorPos !== 0) {
                        this.removeChar("backspace");
                    }

                    for (i = 0; i < string.length; i++) {
                        this.addChar(string[i]);
                    }

                } else throw new Error("The first argument passed to Kinetic.EditableText.text() must be a string");
            }
        }
    };

    Kinetic.Util.extend(Kinetic.EditableText, Kinetic.Text);
}

// Define an AMD module
if (typeof define === 'function' && typeof define.amd === 'object') {
    define({ init: init });
}

// Define a CommonJS module
else if (typeof module !== 'undefined' && module.exports) {
    module.kineticEditableText = { init: init };
}

// Define Kinetic.EditableText globally
else {
    init();
}