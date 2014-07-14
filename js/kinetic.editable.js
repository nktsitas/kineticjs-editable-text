
/**
 * KineticJS EditableText Extension
 * Compatible with KineticJS JavaScript Library v5.1.0
 * Author: Nikos Tsitas
 * Date: Apr 22 2014
 * Updated: June 6 2014 Update Author: Beltran Daniel
 */

////////////////////
// EditableText //
////////////////////

/**
 * EditableText constructor. EditableText extends Text
 * @constructor
 * @param {Object} config
 */
Kinetic.EditableText = function(config) {
    config.name = "EditableText";
    config.fontSize = config.fontSize || 16;
    config.lineHeight = config.lineHeight || 1.3;
    config.focusRectColor = config.focusRectColor || 'black';
    config.unfocusOnEnter = config.unfocusOnEnter || false;
    config.pasteModal = config.pasteModal || null;
//    config.rotateAnchor = config.rotateAnchor  || null;
//    if (config.focusLayer === undefined) {
//        throw new Error("Please Provide a Focus Layer (config.focusLayer).");
//    }

    var textHeight = config.fontSize;
    this.lineHeightPx = config.lineHeight * textHeight;
// focus rectangle - 'TextBox'
    this.focusRectW = (100 < config.fontSize * 3) ? config.fontSize * 4 : 100;
    this.focusRectH = textHeight + 10;
    this.initialRectH = textHeight + 10;
    this.focusRectColor = config.focusRectColor;
    this.focusLayer = config.focusLayer;
//    this.focusLayer = config.focusLayer;
//    this.rotateAnchor = config.rotateAnchor;

    this.tempText = Array();
    this.tempText[0] = new Kinetic.Text(config);
    this.currentLine = 0;
    this.maxWidth = 0;
    this.totalLines = 1;
    this.stage = config.focusLayer.getStage();
    this.currentWordLetters = 0;
    this.currentWordCursorPos = 0;
    this.unfocusedOnce = false;
    this.image = config.image;
    this.imagehover = config.imagehover;
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
var curText;
Kinetic.EditableText.prototype = {
    setColor: function(color) {
        this.config.Fill = color;
        for (var index = 0; index < this.tempText.length; index++) {
            this.tempText[index].setFill(color);
        }
    },
    setSize: function(size) {
        this.config.fontSize = size;
        this.lineHeightPx = this.config.lineHeight * size;
        for (var index = 0; index < this.tempText.length; index++) {
            this.tempText[index].setFontSize(size);
            this.tempText[index].lineHeightPx = this.lineHeightPx;
        }
        for (var index = 0; index < this.tempText.length; index++) {
            var iterTempText = this.tempText[index];
            iterTempText.setX(this.getX());
            iterTempText.setY(this.getY() + index * this.lineHeightPx);
        }
        this.focusRectH = size + 10;
        this.initialRectH = size + 10;
        this.detectCursorPosition();
        this.maxWidth = this.tempText[0].getWidth();
        for (var index = 0; index <= this.totalLines - 1; index++) {
            if (this.tempText[index].getWidth() >= this.maxWidth) {
                var newWidth = (80 < this.tempText[index].getWidth() ? this.tempText[index].getWidth() + 20 : 100);
                this.focusRect.setWidth(newWidth);
                this.focusRectW = newWidth;
                this.maxWidth = newWidth;
            }
        }
        this.focusRect.setHeight((this.totalLines) * this.lineHeightPx + 5);
        this.updateOffset();
    },
    setFont: function(font) {
        this.config.fontFamily = font;
        for (var index = 0; index < this.tempText.length; index++) {
            this.tempText[index].setFontFamily(font);
        }
        this.detectCursorPosition();
        this.updateOffset();
    },
    /*
     * function: focus
     * parameters: none
     * summary:
     */
    focus: function() {
//this.updateOffset();
        var xoffset = this.focusRectW / 2;
        var yoffset = this.focusRectH / 2;
        this.rotateGroup = new Kinetic.Group({
            x: this.getX(),
            y: this.getY(),
            draggable: true
        });
        this.rotateGroup.setRotationDeg(this.getRotationDeg());

        this.setDraggable(false);
        try {
            this.staticLayer = this.getLayer();
        }
        catch (e) {
            throw new Error("Add to a layer first, before focus");
        }

        this.initKeyHandlers();
        this.hide();
//        this.setOffset({x: xoffset, y: yoffset});
//        for (var index = 0; index <= this.tempText.length - 1; index++) {
//            this.tempText[index].setOffset({x: xoffset, y: yoffset});
////            this.rotateGroup.add(this.tempText[index]);
//        }
        this.staticLayer.draw();
        var imageFill = this.image;
        var imageFillHover = this.imagehover;
        that = this;
        this.rotateAnchor = new Kinetic.Circle({
            x: 0 + this.focusRectW / 2 - xoffset,
            y: 0 + 5 - yoffset,
//            x: this.getX() + this.focusRectW / 2 - xoffset,
//            y: this.getY() + 5 - yoffset,
            radius: 20,
            name: "name",
            fillPatternImage: imageFill,
            fillPatternOffset: {x: -20, y: -20},
            draggable: true
        });
        this.rotateAnchor.on("dragmove", function() {
            var pos = that.stage.getPointerPosition();
            var pointx = pos.x - that.rotateGroup.getX();
            var pointy = pos.y - that.rotateGroup.getY();
            var degrad = (Math.atan2(pointy, pointx) * 180 / Math.PI) + 90;
            that.rotateGroup.setRotationDeg(degrad);
            that.setRotationDeg(degrad);
            this.setY(5 - that.focusRectH / 2);
            that.getLayer().draw();
        });
        this.rotateAnchor.on("dragend", function() {
            that.getLayer().draw();
        });
        this.rotateAnchor.on("mouseover", function() {
            this.setFillPatternImage(imageFillHover);
            document.body.style.cursor = "pointer";
            that.getLayer().draw();
        });
        this.rotateAnchor.on("mouseout", function() {
            this.setFillPatternImage(imageFill);
            document.body.style.cursor = "default";
            that.getLayer().draw();
        });
        this.focusRect = new Kinetic.Rect({
            x: 0 - 5 - xoffset,
            y: 0 - 5 - yoffset,
            width: this.focusRectW,
            height: (this.totalLines) * this.lineHeightPx + 5,
            fill: 'white',
            opacity: 0.2,
            stroke: this.focusRectColor,
            strokeWidth: 0,
            listening: true
        });
        this.focusRect.on("click", function() {
//            that.checkClick();
//            that.detectCursorPosition();
            that.findCursorPosFromClick(true);
            this.getLayer().draw();
        });
                    this.focusRect.on('dragend', function(evt) {
                that.findCursorPosFromClick(true);
            });
        this.focusRect.on('mouseover', function(evt) {
            document.body.style.cursor = 'text';
        });
        this.focusRect.on('mouseout', function(evt) {
            document.body.style.cursor = 'default';
        });
//        console.log(this.focusRect.getListening() + 'sdfsfsdfsd ');
        this.cursorLine = new Kinetic.Line({
            points: [5, 5, 5, this.initialRectH + 5],
//            points: [2- xoffset-this.rotateGroup.getX(), - yoffset-this.rotateGroup.getY(),  2 - xoffset-this.rotateGroup.getX(), this.initialRectH - 10 - yoffset-this.rotateGroup.getY()],
            stroke: 'black'
        });
//                this.cursorLine2 = new Kinetic.Line({
////            points: [5, 5, 5, this.initialRectH +5],
//            points: [2- xoffset + this.getX(), - yoffset,this.getX()+  2 - xoffset, this.initialRectH - 10 - yoffset],
//            stroke: 'black'
//        });
//        this.rotateGroup.add(this.cursorLine2);
        var that = this;
        this.cursorInterval = setInterval(function() {
            if (that.cursorLine.isVisible())
                that.cursorLine.hide();
            else
                that.cursorLine.show();
            that.focusLayer.draw();
        }, 500);
        this.updateOffset();
        this.findCursorPosFromClick(false);
//        this.focusRect.setListening(false);
        this.cursorLine.setListening(false);
        this.rotateGroup.add(this.focusRect);
        this.rotateGroup.add(this.cursorLine);
        this.rotateGroup.add(this.rotateAnchor);
        for (var index = 0; index <= this.tempText.length - 1; index++) {
            this.rotateGroup.add(this.tempText[index]);
            this.tempText[index].setX(0);
            this.tempText[index].setY(index * this.lineHeightPx);
        }
        this.focusLayer.add(this.rotateGroup);
        this.focusLayer.draw();
    },
    updateOffset: function() {
        this.focusRectH = (this.totalLines) * this.lineHeightPx;
        this.maxWidth = this.tempText[0].getWidth();
        for (var index = 0; index <= this.totalLines - 1; index++) {
            if (this.tempText[index].getWidth() >= this.maxWidth) {
                var newWidth = (80 < this.tempText[index].getWidth() ? this.tempText[index].getWidth() + 20 : 100);
                this.focusRect.setWidth(newWidth);
                this.focusRectW = newWidth;
                this.maxWidth = newWidth;
            }
        }
        var xoffset = this.focusRectW / 2;
        var yoffset = this.focusRectH / 2;

        this.setOffset({x: xoffset, y: yoffset});
        for (var index = 0; index <= this.tempText.length - 1; index++) {
            this.tempText[index].setX(0);
            this.tempText[index].setY(index * this.lineHeightPx);
            var temp = this.tempText[index].setOffset({x: xoffset, y: yoffset});
        }
        this.staticLayer.draw();
        this.rotateAnchor.setY(5 - yoffset);
        this.focusRect.setX(-5 - xoffset);
        this.focusRect.setY(-5 - yoffset);
        this.focusLayer.draw();
        this.detectCursorPosition();

        this.focusLayer.draw();
    },
    /*
     * function: findCursorPosFromClick
     * params: Boolean secondary
     * summary:
     */
    findCursorPosFromClick: function(secondary) {
        var xoffset = this.focusRectW / 2;
        var yoffset = this.focusRectH / 2;
        var that = this;

        var pos = that.stage.getPointerPosition();

        var xxgroup3 = new Kinetic.Group({
            x: +xoffset,
            y: +yoffset,
            draggable:false
        });
        that.focusLayer.add(xxgroup3);
        
        var xxx3 = new Kinetic.Circle({
            x: pos.x - that.rotateGroup.getX() + 5,
            y: pos.y - that.rotateGroup.getY() + 5,
            radius: 0,
            fill: 'blue'
        });
        xxgroup3.add(xxx3);
        xxgroup3.setRotationDeg(-that.rotateGroup.getRotationDeg());
        xxgroup3.getLayer().draw();

        for (var index = 0; index < this.tempText.length; index++) {
            var iterTempText = this.tempText[index];

            iterTempText.setX(0);
            iterTempText.setY(index * that.lineHeightPx);
            // secondary check
            if (!secondary) {
                that.rotateGroup.add(iterTempText);
            }
            // Checking Coords
            pos.x = xxx3.getAbsolutePosition().x;
            pos.y = xxx3.getAbsolutePosition().y;

            if ((pos.y < iterTempText.getY() + that.lineHeightPx) && (pos.y > iterTempText.getY()))
            {
                // Match
                that.currentLine = index;
//                var letterFound = false;
                var iterations = 0;
                var theWord = iterTempText.clone();
                var wordW = theWord.getWidth();
//                var cursorX = pos.x + 5;
                while (wordW > 0 && iterations < 4000) {
                    wordW = theWord.getWidth();
                    curText = theWord.getText();
                    theWord.setText(curText.substring(0, curText.length - 1));
                    iterations++;
                }

                that.currentWordLetters = iterations === 0 ? 0 : iterations - 1;
                iterations = 0;
                theWord = that.tempText[that.currentLine].clone();
                wordW = theWord.getWidth();
                var prevWordW;
                var toLeft = true;
                while (wordW > 0) {
                    prevWordW = wordW;
                    wordW = theWord.getWidth();
                    if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
                        // Match
                        // Calculate Diffs and decide whether to go left or right
//                        cursorX = that.tempText[that.currentLine].getX() + wordW;
                        if ((pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW - wordW) / 2)
                            toLeft = false;
                        that.currentWordCursorPos = that.currentWordLetters - iterations;
                        break;
                    }

                    curText = theWord.getText();
                    theWord.setText(curText.substring(0, curText.length - 1));
                    iterations++;
                }

                if (!toLeft && that.currentWordCursorPos < that.currentWordLetters)
                    that.currentWordCursorPos++;
                that.detectCursorPosition();
            }
        }
        ;
//        });
        that.focusLayer.draw();
// Keep cursor on when moving/writing
//        that.cursorLine.show();
//        that.focusLayer.draw();
//        clearInterval(that.cursorInterval);
//        that.cursorInterval = setInterval(function() {
//            if (that.cursorLine.isVisible())
//                that.cursorLine.hide();
//            else
//                that.cursorLine.show();
//            that.focusLayer.draw();
//        }, 500);
        
        xxgroup3.destroy();
// -----
    },
    countLetters: function(theWord) {
        var iterations = 0;
        var wordW = theWord.getWidth();
        while (wordW > 0 && iterations < 4000) {
            wordW = theWord.getWidth();
            curText = theWord.getText();
            theWord.setText(curText.substring(0, curText.length - 1));
            iterations++;
        }

        return iterations === 0 ? 0 : iterations - 1;
    },
    detectCursorPosition: function() {
        var xoffset = this.focusRectW / 2;
        var yoffset = this.focusRectH / 2;

        var theWord = this.tempText[this.currentLine].clone();
//        var wordW = theWord.getWidth();
        var cursorX = this.cursorLine.getX();
        curText = theWord.getText();
        theWord.setText(curText.substring(0, this.currentWordCursorPos));
        cursorX = this.tempText[this.currentLine].getX() + theWord.getWidth();
        
        var cursorLineX = cursorX;
        var cursorLineY = this.tempText[this.currentLine].getY();
        var cursorLineHeight = this.initialRectH - 10;
        this.cursorLine.setPoints([cursorLineX - xoffset, cursorLineY - yoffset, cursorLineX - xoffset, cursorLineY - yoffset + cursorLineHeight]);
//        this.focusLayer.draw();
    },
// Check if user's click was inside this text
    checkClick: function() {
        var xoffset = this.focusRectW / 2;
        var yoffset = this.focusRectH / 2;
        var pos = this.stage.getPointerPosition();

        var tempx = this.getX() - xoffset;
        var tempy = this.getY() - yoffset;
        var xxx = (
                (pos.x > tempx) && (pos.x < tempx + this.focusRect.getWidth()) &&
                (pos.y > tempy) && (pos.y < tempy + this.focusRect.getHeight())
                );
//        return xxx;
        return true;
    },
    unfocus: function(e) {
        this.setDraggable(true);
        clearInterval(this.cursorInterval);
        var finalText = '';
//        $.each(this.tempText, function(index, iterTextLine) {
        /**method that no /n is created after last line so that the hit region remains as big as text */
        if (this.tempText.length > 1) {
            for (var index = 0; index < this.tempText.length - 1; index++) {
                var iterTextLine = this.tempText[index];
                finalText += iterTextLine.getText() + "\n";
            }
        }
        finalText += this.tempText[this.tempText.length - 1].getText();
//        console.log(this.tempText[0].getX());
//        console.log(this.getX());
        this.setText(finalText);
        this.setX(this.rotateGroup.getX());
        this.setY(this.rotateGroup.getY());
        this.setFill(this.config.Fill);
        this.setFontFamily(this.config.fontFamily);
        this.setFontSize(this.config.fontSize);
        this.focusRect.destroy();
        this.cursorLine.destroy();
        this.rotateAnchor.destroy();
        this.rotateGroup.destroy();
//this.currentText.destroy();

//this.tempText.destroy();
//        $.each(this.tempText, function(index, iterTextLine) {
        for (var index = 0; index < this.tempText.length; index++) {
//            var iterTextLine = this.tempText[index];
//            iterTextLine.destroy();
            this.tempText[index].destroy();
        }
//        });

//this.focusLayer.removeChildren();
        this.focusLayer.draw();
        this.show();
        this.staticLayer.draw();
        if (this.maxWidth === 0)
            this.destroy();
        window.onkeydown=false;
        window.onkeypress=false;
        window.onkeyup=false;
//        $("body").off("keydown");
//        $("body").off("keypress");
//        $("body").off("keyup");

        this.fire("unfocusText");
        this.unfocusedOnce = true;
    },
    initKeyHandlers: function() {
        var that = this;
        //key handlers
//        body.onkeydown = function(e) {
        window.onkeydown = function(e) {
//        $("body").on("keydown", function(e) {
            var code = e.charCode || e.keyCode;
            // Keep cursor on when moving/writing
            that.cursorLine.show();
            that.focusLayer.draw();
            clearInterval(that.cursorInterval);
            that.cursorInterval = setInterval(function() {
                if (that.cursorLine.isVisible())
                    that.cursorLine.hide();
                else
                    that.cursorLine.show();
                that.focusLayer.draw();
            }, 500);
// -----

            switch (code) {
// 16: Shift
                case 16:
                    if (that.shiftDown)
                        break;
                    that.shiftDown = true;
                    break;
// 17: Ctrl
                case 17:
                    if (that.ctrlDown)
                        break;
                    that.ctrlDown = true;
                    break;
// 86: 'v' -> Paste
                case 86:
//                    if (that.ctrlDown) {
//                        $("#" + that.config.pasteModal).val('');
//                        $("#" + that.config.pasteModal).focus();
//
//                        setTimeout(function() {
//                            var currentTextString = that.tempText[that.currentLine].getText();
//                            var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
//                            var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);
//
//                            var pastedText = $("#" + that.config.pasteModal).val();
//
//                            var pastedTextLinesArray = pastedText.split(/\r\n|\r|\n/g);
//
////                            $.each(pastedTextLinesArray, function(index, iterPastedLine) {
//                            for (var index = 0; index < this.pastedTextLinesArray.length; index++) {
//                                var iterPastedLine = this.pastedTextLinesArray[index];
//
//                                if (index > 0)
//                                    that.newLine();
//
//                                var newTextString = ((index > 0) ? '' : textBeforeCursor) + iterPastedLine + ((index === pastedTextLinesArray.length - 1) ? textAfterCursor : '');
//                                that.tempText[that.currentLine].setText(newTextString);
//
//                                that.currentWordCursorPos += iterPastedLine.length;
//                                that.currentWordLetters += iterPastedLine.length;
//
//                                that.detectCursorPosition();
//
//                                $.each(that.tempText, function(index2, iterTempText) {
//                                    if (iterTempText.getWidth() > that.maxWidth)
//                                        that.maxWidth = iterTempText.getWidth();
//                                });
//
//                                if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
//                                    that.maxWidth = that.tempText[that.currentLine].getWidth();
//                                }
//
//                                if (that.tempText[that.currentLine].getWidth() >= that.maxWidth) {
//                                    that.focusRect.setWidth(80 < that.tempText[that.currentLine].getWidth() ? that.tempText[that.currentLine].getWidth() + 20 : 100);
//                                }
//
//                                that.focusRectW = that.focusRect.getWidth();
//                                that.focusLayer.draw();
//                            }
//                            ;
//                        }, 1);
//                    }

                    break;
// 37: Left Arrow
// 39: Right Arrow
                case 37:
                case 39:
                    if (code === 37 && that.currentWordCursorPos === 0) {

                        if (that.currentLine === 0)
                            return false;
                        that.currentLine--;
                        var theWord = that.tempText[that.currentLine].clone();
                        var prevLineLetterCount = that.countLetters(theWord);
                        that.currentWordCursorPos = prevLineLetterCount;
                        that.currentWordLetters = prevLineLetterCount;
                        that.detectCursorPosition();
                        that.focusLayer.draw();
                        return false;
                    }
                    if (code === 39 && that.currentWordCursorPos === that.currentWordLetters) {

                        if (that.currentLine === that.totalLines - 1)
                            return false;
                        that.currentLine++;
                        var theWord = that.tempText[that.currentLine].clone();
                        var nextLineLetterCount = that.countLetters(theWord);
                        that.currentWordCursorPos = 0;
                        that.currentWordLetters = nextLineLetterCount;
                        that.detectCursorPosition();
                        that.focusLayer.draw();
                        return false;
                    }

                    code === 37 ? that.currentWordCursorPos-- : that.currentWordCursorPos++;
//code==37?console.log("left"):console.log("right");

                    that.detectCursorPosition();
                    that.focusLayer.draw();
                    return false;
                    break;
// 38: Up Arrow
// 40: Down Arrow
                case 38:
                case 40:
// code==38?console.log("up"):console.log("down");

                    if (code === 38 && that.currentLine === 0)
                        return false;
                    if (code === 40 && that.currentLine === that.totalLines - 1)
                        return false;
                    code === 38 ? that.currentLine-- : that.currentLine++;
                    var pos = {
                        x: that.cursorLine.getPoints()[0].x,
                        y: that.tempText[that.currentLine].getY()
                    };
// TODO this must be a copy-paste from somewhere...
                    var iterations = 0;
                    var theWord = that.tempText[that.currentLine].clone();
                    var wordW = theWord.getWidth();
                    var cursorX = pos.x + 5;
                    while (wordW > 0 && iterations < 4000) {
                        wordW = theWord.getWidth();
                        curText = theWord.getText();
                        theWord.setText(curText.substring(0, curText.length - 1));
                        iterations++;
                    }

                    that.currentWordLetters = iterations === 0 ? 0 : iterations - 1;
                    iterations = 0;
                    theWord = that.tempText[that.currentLine].clone();
                    wordW = theWord.getWidth();
                    var prevWordW;
                    var toLeft = true;
                    while (wordW > 0) {
                        prevWordW = wordW;
                        wordW = theWord.getWidth();
                        if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
                            cursorX = that.tempText[that.currentLine].getX() + wordW;
                            if ((pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW - wordW) / 2)
                                toLeft = false;
                            that.currentWordCursorPos = that.currentWordLetters - iterations;
                            break;
                        }

                        curText = theWord.getText();
                        theWord.setText(curText.substring(0, curText.length - 1));
                        iterations++;
                    }
// ****

                    if (!toLeft && that.currentWordCursorPos < that.currentWordLetters)
                        that.currentWordCursorPos++;
                    if (that.currentWordCursorPos > that.currentWordLetters)
                        that.currentWordCursorPos = that.currentWordLetters;
                    that.detectCursorPosition();
                    that.focusLayer.draw();
                    return false;
                    break;
// 35: End
// 36: Home
                case 35:
                case 36:
// code==35?console.log("end"):console.log("home");

                    if (code === 36)
                        that.currentWordCursorPos = 0;
                    if (code === 35)
                        that.currentWordCursorPos = that.currentWordLetters;
                    that.detectCursorPosition();
                    that.focusLayer.draw();
                    return false;
                    break;
// 8: Backspace
// 46: Delete
                case 8:
                case 46:
// if (code==8) console.log("backspace");

// Backspace
                    if (code === 8 && that.currentWordCursorPos === 0) {

                        if (that.currentLine > 0) {
                            var currentTextString = that.tempText[that.currentLine].getText();
                            var prevLineString = (that.tempText[that.currentLine - 1]) ? that.tempText[that.currentLine - 1].getText() : "";
                            var prevLineLettersCount = that.countLetters(that.tempText[that.currentLine - 1].clone());
                            that.tempText[that.currentLine - 1].setText(prevLineString + currentTextString);
                            that.currentWordLetters += prevLineLettersCount;
                            that.currentLine--;
                            that.currentWordCursorPos = prevLineLettersCount;
                            for (i = that.currentLine + 1; i < that.totalLines - 1; i++) {
                                that.tempText[i].setText(that.tempText[i + 1].getText());
                            }

                            that.tempText[i].setText("");
                            that.focusRect.setHeight(that.focusRect.getHeight() - that.lineHeightPx);
                            that.totalLines--;
                            var oldWidth = that.tempText[that.currentLine].getWidth();
                            if (oldWidth >= that.maxWidth) {
                                that.focusRect.setWidth(80 < that.tempText[that.currentLine].getWidth() ? that.tempText[that.currentLine].getWidth() + 20 : 100);
                                that.maxWidth = that.tempText[that.currentLine].getWidth();
                            }

                            that.detectCursorPosition();
                            that.focusLayer.draw();
                        }

                        return false;
                    }
// Delete
                    if (code === 46 && that.currentWordCursorPos === that.currentWordLetters) {

                        if (that.currentLine < that.totalLines - 1) {
                            var currentTextString = that.tempText[that.currentLine].getText();
                            var nextLineString = (that.tempText[that.currentLine + 1]) ? that.tempText[that.currentLine + 1].getText() : "";
                            that.tempText[that.currentLine].setText(currentTextString + nextLineString);
                            var nextLineLettersCount = that.countLetters(that.tempText[that.currentLine + 1].clone());
                            that.currentWordLetters += nextLineLettersCount;
                            for (i = that.currentLine + 1; i < that.totalLines - 1; i++) {
                                that.tempText[i].setText(that.tempText[i + 1].getText());
                            }

                            that.tempText[i].setText("");
                            that.focusRect.setHeight(that.focusRect.getHeight() - that.lineHeightPx);
                            that.totalLines--;
                            var oldWidth = that.tempText[that.currentLine].getWidth();
                            if (oldWidth >= that.maxWidth) {
                                that.focusRect.setWidth(80 < that.tempText[that.currentLine].getWidth() ? that.tempText[that.currentLine].getWidth() + 20 : 100);
                                that.maxWidth = that.tempText[that.currentLine].getWidth();
                            }

                            that.focusLayer.draw();
                        }

                        return false;
                    }

                    var deletedText = that.tempText[that.currentLine].getText();
                    var deletedTextStart = deletedText.substring(0, code === 8 ? that.currentWordCursorPos - 1 : that.currentWordCursorPos);
                    var deletedTextEnd = deletedText.substring(code === 8 ? that.currentWordCursorPos : that.currentWordCursorPos + 1, deletedText.length);
                    deletedText = deletedTextStart + deletedTextEnd;
                    if (code === 8)
                        that.currentWordCursorPos--;
                    that.currentWordLetters--;
                    var oldWidth = that.tempText[that.currentLine].getWidth();
                    that.tempText[that.currentLine].setText(deletedText);
                    that.detectCursorPosition();
                    for (var index = 0; index < that.tempText.length; index++) {
                        var iterTempText = that.tempText[index];
                        if (iterTempText.getWidth() > that.maxWidth) {
                            that.maxWidth = iterTempText.getWidth();
                        }
                    }
//                    $.each(that.tempText, function(index, iterTempText) {
//                        if (iterTempText.getWidth() > that.maxWidth)
//                            that.maxWidth = iterTempText.getWidth();
//                    });

                    if (oldWidth >= that.maxWidth) {
                        that.focusRect.setWidth(80 < that.tempText[that.currentLine].getWidth() ? that.tempText[that.currentLine].getWidth() + 20 : 100);
                        that.maxWidth = that.tempText[that.currentLine].getWidth();
                    }

                    that.focusRectW = that.focusRect.getWidth();
                    that.updateOffset();
                    that.focusLayer.draw();
                    return false;
                    break;
                    // 13: Enter
                case 13:

                    if (that.unfocusOnEnter)
                        that.unfocus(e);
                    else {
                        if (that.ctrlDown) {
                            that.unfocus(e);
                            that.ctrlDown = false;
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
//        });
        };
        window.onkeyup = function(e) {
//        $("body").on("keyup", function(e) {
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
        };
//        });

        // General text input
        window.onkeypress = function(e) {
            //        $("body").on("keypress", function(e) {
            var code = e.charCode || e.keyCode;
            // Ignore all keys handled in keydown above.
            if (code === 8 || code === 13 || code === 37 || code === 38 || code === 39 || code === 40)
                return;
            var theChar = String.fromCharCode(code);
            var currentTextString = that.tempText[that.currentLine].getText();
            var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
            var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);
            var newTextString = textBeforeCursor + theChar + textAfterCursor;
            that.tempText[that.currentLine].setText(newTextString);
            /**important for click events that indicate cursor position for first line*/
            that.tempText[that.currentLine].setListening(false);
            that.currentWordCursorPos++;
            that.currentWordLetters++;
            that.detectCursorPosition();
//            $.each(that.tempText, function(index, iterTempText) {
            for (var index = 0; index < that.tempText.length; index++) {
                var iterTempText = that.tempText[index];
                if (iterTempText.getWidth() > that.maxWidth)
                    that.maxWidth = iterTempText.getWidth();
            }

            if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
                that.maxWidth = that.tempText[that.currentLine].getWidth();
            }

            if (that.tempText[that.currentLine].getWidth() >= that.maxWidth) {
                that.focusRect.setWidth(80 < that.tempText[that.currentLine].getWidth() ? that.tempText[that.currentLine].getWidth() + 20 : 100);
            }

            that.focusRectW = that.focusRect.getWidth();
            that.updateOffset();
            that.focusLayer.draw();
            return false;
        };
//        });
    },
    newLine: function() {
//        var xoffset = this.focusRectW / 2;
//        var yoffset = this.focusRectH / 2;
        var xoffset = 0;
        var yoffset = 0;
        var that = this;
        that.focusRect.setHeight(that.focusRect.getHeight() + that.lineHeightPx);
        that.currentLine++;
        that.totalLines++;
        var newLineIndex = that.totalLines - 1;

//        var temp =  new Kinetic.Text(that.config);
//        this.rotateGroup.add(temp);
//        that.tempText[newLineIndex] = temp;

        that.tempText[newLineIndex] = new Kinetic.Text(that.config);
//                for (var index = 0; index <= this.tempText.length - 1; index++) {
//            this.rotateGroup.add(this.tempText[index]);
//            this.tempText[index].setX(0);
//            this.tempText[index].setY(0);
////            this.rotateGroup.add(this.tempText[index]);
//        }
//        that.rotateGroup.add(that.tempText[newLineIndex]);

        /**important for click events that indicate cursor position*/
        that.tempText[newLineIndex].setListening(false);
//        that.focusLayer.add(that.tempText[newLineIndex]);
        that.rotateGroup.add(that.tempText[newLineIndex]);
        that.tempText[newLineIndex].setX(that.getX() - xoffset);
        that.tempText[newLineIndex].setY(that.getY() + newLineIndex * that.lineHeightPx - yoffset);
        if (that.currentLine < that.totalLines - 1) {
            for (var i = that.totalLines; i > that.currentLine + 1; i--) {
//                console.log("line: " + i);        

                that.tempText[i - 1].setText(that.tempText[i - 2].getText());
                that.tempText[i - 1].setX(0);
                that.tempText[i - 1].setY((i - 1) * that.lineHeightPx);
            }
        }

// ---
        var currentTextString = that.tempText[that.currentLine - 1].getText();
        var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
        var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);
        that.tempText[that.currentLine - 1].setText(textBeforeCursor);
        that.tempText[that.currentLine].setText(textAfterCursor);
// ---

        that.currentWordCursorPos = 0;
        that.currentWordLetters = textAfterCursor.length;
        that.detectCursorPosition();
        this.rotateGroup.add(this.tempText[that.currentLine]);
        this.tempText[that.currentLine].setX(0);
        this.tempText[that.currentLine].setY((that.currentLine) * that.lineHeightPx);
        that.updateOffset();
        that.focusLayer.draw();
    }
};
// extend Text
Kinetic.Util.extend(Kinetic.EditableText, Kinetic.Text);
