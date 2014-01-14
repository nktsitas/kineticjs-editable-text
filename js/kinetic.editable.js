/**
 * KineticJS EditableText Extension
 * Compatible with KineticJS JavaScript Library v4.3.3
 * Author: Nikos Tsitas
 * Date: Mar 26 2013
 */
 
///////////////////////////////////////////////////////////////////////
//  EditableText
///////////////////////////////////////////////////////////////////////
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
	
	if (config.focusLayer==undefined) {
		throw new Error("Please Provide a Focus Layer (config.focusLayer)."); 
	}
	
	var textHeight = config.fontSize;
	this.lineHeightPx = config.lineHeight * textHeight;

	this.focusRectW = (100<config.fontSize*3)?config.fontSize*4:100;
	//this.focusRectH = config.fontSize+10;
	this.focusRectH = textHeight+10;
	this.initialRectH = textHeight+10;
	this.focusRectColor = config.focusRectColor;
	this.focusLayer = config.focusLayer;
	
	this.tempText = Array();
	this.tempText[0] = new Kinetic.Text(config);
	this.currentLine = 0;
	//this.currentText = this.tempText[0];
	this.maxWidth = 0;
	this.totalLines = 1;

	this.stage = config.stage;

	console.log(config.stage);
	console.log(this.stage);
	
	this.currentWordLetters = 0;
	this.currentWordCursorPos = 0;
	
	this.unfocusedOnce=false;
	
	// call super constructor
	Kinetic.Text.call(this, config);
	this.classType = "EditableText";
	
	this.config = config;
};

/*
 * EditableText methods
 */
Kinetic.EditableText.prototype = {
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
		//this.setListening(false);
		
		this.focusRect = new Kinetic.Rect({
			x: this.getX()-5,
			y: this.getY()-5,
			width: this.focusRectW,
			height: this.totalLines * this.lineHeightPx + 5,
			stroke: this.focusRectColor,
			strokeWidth: 1,
			listening: false,
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
		
		var obj = this.stage.getIntersection(this.stage.getUserPosition());
		console.log(obj);
	},
	
	findCursorPosFromClick: function(secondary) {
	
		var that = this;
		
		$.each(this.tempText, function(index, iterTempText) {
			iterTempText.setX(that.getX());
			iterTempText.setY(that.getY() + index*that.lineHeightPx);
			
			if (!secondary) that.focusLayer.add(iterTempText);
			
			console.log(iterTempText);
			
			console.log(that.stage);
			var pos = that.stage.getUserPosition();
			console.log('CHECKING COORDS');
			if (!secondary) console.log("secondary!");
			console.log(pos.x+","+pos.y);
			console.log(iterTempText.getX()+","+iterTempText.getY());
			
			if ( 	(pos.y < iterTempText.getY() + that.lineHeightPx) &&
					(pos.y > iterTempText.getY())  ) {
						console.log("MATCH!!");
						
						that.currentLine = index;
						
						console.log("current Line is: "+that.currentLine);
						
						var letterFound = false;
						var iterations = 0
						var theWord = iterTempText.clone();
						var wordW=theWord.getWidth();
						var cursorX = pos.x+5;
						
						while (wordW>0 && iterations < 4000) {
							wordW = theWord.getWidth();
							console.log("wordW: "+wordW);
							console.log("iterations: "+iterations);
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
						
						console.log("wordW START: "+wordW);
						while (wordW>0) {
							prevWordW = wordW;
							wordW = theWord.getWidth();
							console.log("prevWordW: "+prevWordW);
							console.log("wordW: "+wordW);
							
							if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
								console.log("OMG MATCCHHH!!");
								console.log("diff is: "+ (pos.x - (that.tempText[that.currentLine].getX() + wordW)) )
								console.log("letters diff is: "+ (prevWordW-wordW));
								cursorX = that.tempText[that.currentLine].getX() + wordW;
								
								if ( (pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW-wordW)/2 ) toLeft=false;
								
								console.log("toLeft: "+toLeft);
								
								that.currentWordCursorPos = that.currentWordLetters - iterations;
								break;
							}
							
							curText = theWord.getText();
							theWord.setText(curText.substring(0,curText.length-1));
							
							iterations++;
						}
						
						if (!toLeft && that.currentWordCursorPos<that.currentWordLetters) that.currentWordCursorPos++;
						
						that.detectCursorPosition();
						
						//var cursorLineX = cursorX;
						//var cursorLineY = iterTempText.getY();
						//var cursorLineHeight = that.focusRectH-10;
						
						//that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
					}
			
			//var lalaText = new Kinetic.Text(that.config);
			//var lalaText = iterTempText.clone();
			//that.focusLayer.add(lalaText);
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
		console.log("count letters");
		console.log(theWord);
		console.log(theWord.getWidth());
		
		var iterations = 0;
		//var theWord = that.tempText[that.currentLine].clone();
		var wordW=theWord.getWidth();
		
		while (wordW>0 && iterations < 4000) {
			wordW = theWord.getWidth();
			console.log("wordW: "+wordW);
			console.log("iterations: "+iterations);
			curText = theWord.getText();
			theWord.setText(curText.substring(0,curText.length-1));
			iterations++;
		}
		
		//that.currentWordLetters = iterations==0?0:iterations-1;
		
		return iterations==0?0:iterations-1;
	},
	
	detectCursorPosition: function() {
		console.log("detectCursorPosition");
		console.log(this.currentLine);
		console.log(this.currentWordCursorPos);
		console.log(this.currentWordLetters);
		
		var theWord = this.tempText[this.currentLine].clone();
		var wordW = theWord.getWidth();
		var cursorX = this.cursorLine.getX();
		var curText = theWord.getText();
		
		theWord.setText(curText.substring(0,this.currentWordCursorPos));
		//cursorX = this.currentText.getX() + theWord.getWidth();
		cursorX = this.tempText[this.currentLine].getX() + theWord.getWidth();
		
		var cursorLineX = cursorX;
		var cursorLineY = this.tempText[this.currentLine].getY();
		var cursorLineHeight = this.focusRectH-10;
		
		this.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
	},
	
	checkClick: function() {
	
		console.log('CHECKING checkClick');
		
		var pos = this.stage.getUserPosition();
			
		console.log(pos.x+","+pos.y);
		console.log(this.getX()+","+this.getY());
		console.log(this.focusRectW+","+this.focusRectH);
		
		console.log((pos.x > this.getX()));
		console.log((pos.x < this.getX() + this.focusRect.getWidth()));
		console.log((pos.y > this.getY()));
		console.log((pos.y < this.getY() + this.focusRect.getHeight()));
		
		return ( (pos.x > this.getX()) && (pos.x < this.getX() + this.focusRect.getWidth()) &&
			(pos.y > this.getY()) && (pos.y < this.getY() + this.focusRect.getHeight()) );
	},
	
	unfocus: function(e) {
	
		//console.log(this.checkClick());
		
		//if (this.checkClick()) {
			//console.log("STOP this madness!!");
			//e.cancelBubble = true;
			//return false;
		//}
			
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
		
		console.log("ELA MWRE UNFOCUSSSS before simu: "+this.unfocusedOnce);
		
		this.simulate("unfocusText");
		
		
		this.unfocusedOnce = true;
		
		console.log("ELA MWRE UNFOCUSSSS: "+this.unfocusedOnce);
	},
	
	initKeyHandlers: function() {
		var that = this;
	
		console.log("KEY HANDLERS ON!");
		
		//key handlers
		$("body").on("keydown", function(e) {
			var code = e.charCode || e.keyCode;
			
			console.log("keydown: "+code);
			
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
				case 37: case 39:
				
					console.log(that.currentWordCursorPos);
					console.log(that.currentWordLetters);
					
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
					code==37?console.log("left"):console.log("right");
					
					// var theWord = that.tempText[that.currentLine].clone();
					// var wordW = theWord.getWidth();
					// var cursorX = that.cursorLine.getX();
					// var curText = theWord.getText();
		// 			
					// theWord.setText(curText.substring(0,that.currentWordCursorPos));
					// cursorX = that.currentText.getX() + theWord.getWidth();
		// 			
					// var cursorLineX = cursorX;
					// var cursorLineY = that.tempText[that.currentLine].getY();
					// var cursorLineHeight = that.focusRectH-10;
		// 			
					// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
					
					that.detectCursorPosition();
					
					that.focusLayer.draw();
					
					return false;
					break;
				case 38: case 40:
					code==38?console.log("up"):console.log("down");
					
					if (code==38 && that.currentLine==0) return false;
					if (code==40 && that.currentLine==that.totalLines-1) return false;
					
					code==38?that.currentLine--:that.currentLine++;
					
					// var theWord = that.tempText[that.currentLine].clone();
					// var wordW = theWord.getWidth();
					// var cursorX = that.cursorLine.getX();
					// var curText = theWord.getText();
		// 			
					// theWord.setText(curText.substring(0,that.currentWordCursorPos));
					// cursorX = that.currentText.getX() + theWord.getWidth();
		// 			
					// var cursorLineX = cursorX;
					// var cursorLineY = that.tempText[that.currentLine].getY();
					// var cursorLineHeight = that.focusRectH-10;
		// 			
					// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
					
					console.log(that.cursorLine);
					console.log(that.cursorLine.getPoints());
					console.log(that.cursorLine.getPoints()[0]);
					
					var pos = { 
						x: that.cursorLine.getPoints()[0].x,
						y: that.tempText[that.currentLine].getY(),
					}
					
			console.log('CHECKING COORDS se fash');
			console.log(pos.x+","+pos.y);
			console.log(that.tempText[that.currentLine].getX()+","+that.tempText[that.currentLine].getY());
					
						var iterations = 0
						var theWord = that.tempText[that.currentLine].clone();
						var wordW=theWord.getWidth();
						var cursorX = pos.x+5;
						
						while (wordW>0 && iterations < 4000) {
							wordW = theWord.getWidth();
							console.log("wordW: "+wordW);
							console.log("iterations: "+iterations);
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
						
						console.log("wordW START: "+wordW);
						while (wordW>0) {
							prevWordW = wordW;
							wordW = theWord.getWidth();
							console.log("prevWordW: "+prevWordW);
							console.log("wordW: "+wordW);
							
							if (pos.x > that.tempText[that.currentLine].getX() + wordW) {
								console.log("OMG MATCCHHH!!");
								console.log("diff is: "+ (pos.x - (that.tempText[that.currentLine].getX() + wordW)) )
								console.log("letters diff is: "+ (prevWordW-wordW));
								cursorX = that.tempText[that.currentLine].getX() + wordW;
								
								if ( (pos.x - (that.tempText[that.currentLine].getX() + wordW)) > (prevWordW-wordW)/2 ) toLeft=false;
								
								that.currentWordCursorPos = that.currentWordLetters - iterations
								break;
							}
							
							curText = theWord.getText();
							theWord.setText(curText.substring(0,curText.length-1));
							
							iterations++;
						}
					
					if (!toLeft && that.currentWordCursorPos<that.currentWordLetters) that.currentWordCursorPos++;
					
					console.log("telos");
					
					if (that.currentWordCursorPos > that.currentWordLetters) that.currentWordCursorPos = that.currentWordLetters;
					
					that.detectCursorPosition();
					
					that.focusLayer.draw();
					
					return false;
					break;
				case 35: case 36:
					code==35?console.log("end"):console.log("home");
					
					if (code==36) that.currentWordCursorPos = 0;
					if (code==35) that.currentWordCursorPos = that.currentWordLetters;
					
					that.detectCursorPosition();
					
					that.focusLayer.draw();
					return false;
					break;
				case 8: case 46:
					if (code==8) console.log("backspace mwre");
				
					if (code==8 && that.currentWordCursorPos == 0) {
						
						if (that.currentLine > 0) {
							var currentTextString = that.tempText[that.currentLine].getText();
							var prevLineString = (that.tempText[that.currentLine-1])?that.tempText[that.currentLine-1].getText():"";
							
							var prevLineLettersCount = that.countLetters(that.tempText[that.currentLine-1].clone());
							console.log(prevLineLettersCount);
							
							that.tempText[that.currentLine-1].setText(prevLineString + currentTextString);
							
							that.currentWordLetters += prevLineLettersCount;
							that.currentLine--;
							that.currentWordCursorPos = prevLineLettersCount;
							
							for (i = that.currentLine+1 ; i < that.totalLines-1 ; i++) {
								console.log("line: "+i);
								
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
						
						return false;
					}
					if (code==46 && that.currentWordCursorPos == that.currentWordLetters) {
						
						if (that.currentLine < that.totalLines-1) {
							var currentTextString = that.tempText[that.currentLine].getText();
							var nextLineString = (that.tempText[that.currentLine+1])?that.tempText[that.currentLine+1].getText():"";
							
							that.tempText[that.currentLine].setText(currentTextString + nextLineString);
							
							var nextLineLettersCount = that.countLetters(that.tempText[that.currentLine+1].clone());
							console.log(nextLineLettersCount);
							
							that.currentWordLetters += nextLineLettersCount;
						
							for (i = that.currentLine+1 ; i < that.totalLines-1 ; i++) {
								console.log("line: "+i);
								
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
						
						return false;
					}
				
					var deletedText = that.tempText[that.currentLine].getText();
					var deletedTextStart = deletedText.substring(0,code==8?that.currentWordCursorPos-1:that.currentWordCursorPos);
					var deletedTextEnd = deletedText.substring(code==8?that.currentWordCursorPos:that.currentWordCursorPos+1,deletedText.length);
					deletedText = deletedTextStart+deletedTextEnd;
					
					if (code==8) that.currentWordCursorPos--;
					that.currentWordLetters--;
					
					var oldWidth = that.tempText[that.currentLine].getWidth();
					that.tempText[that.currentLine].setText(deletedText);
					
					// var theWord = that.tempText[that.currentLine].clone();
					// var wordW = theWord.getWidth();
					// var cursorX = that.cursorLine.getX();
					// var curText = theWord.getText();
		// 			
					// theWord.setText(curText.substring(0,that.currentWordCursorPos));
					// cursorX = that.currentText.getX() + theWord.getWidth();
		// 			
					// var cursorLineX = cursorX;
					// var cursorLineY = that.tempText[that.currentLine].getY();
					// var cursorLineHeight = that.focusRectH-10;
		// 			
					// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
					
					that.detectCursorPosition();
					
					$.each(that.tempText, function(index, iterTempText) {
						if (iterTempText.getWidth() > that.maxWidth) that.maxWidth = iterTempText.getWidth();
					});
					
					// if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
						// that.maxWidth = that.tempText[that.currentLine].getWidth();
					// }
				
					if (oldWidth >= that.maxWidth) {
						that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
						that.maxWidth = that.tempText[that.currentLine].getWidth();
					}
					
					that.focusRectW = that.focusRect.getWidth();
					
					that.focusLayer.draw();
					
					return false;
				
					break;
				case 13:
				
					if (that.unfocusOnEnter) that.unfocus(e);
					else {
						that.focusRect.setHeight(that.focusRect.getHeight() + that.lineHeightPx);
						
						that.currentLine++;
						that.totalLines++;
						
						var newLineIndex = that.totalLines - 1;
						that.tempText[newLineIndex] = new Kinetic.Text(that.config);
						
						that.focusLayer.add(that.tempText[newLineIndex]);
						
						console.log(newLineIndex);
						
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
						
						
						// var theWord = that.tempText[that.currentLine].clone();
						// var wordW = theWord.getWidth();
						// var cursorX = that.cursorLine.getX();
						// var curText = theWord.getText();
			// 			
						// theWord.setText(curText.substring(0,that.currentWordCursorPos));
						// cursorX = that.currentText.getX() + theWord.getWidth();
			// 			
						// var cursorLineX = cursorX;
						// var cursorLineY = that.tempText[that.currentLine].getY();
						// var cursorLineHeight = that.focusRectH-10;
			// 			
						// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
						
						that.detectCursorPosition();
						
						
						
						
						// var cursorLineX = that.currentText.getX() + that.currentText.getWidth() + 2;
						// var cursorLineY = that.currentText.getY();
						// var cursorLineHeight = that.focusRectH-10;
			// 			
						// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
						
						
						
						
						
						that.focusLayer.draw();
					}
					
					return false;
				
					break;
			}
			
			return true;
		});
		
		$("body").on("keypress", function(e) {
			var code = e.charCode || e.keyCode;
			
			console.log("keypress: "+code);
			
			if (code == 8 || code == 13 || code == 37 || code == 38 || code == 39 || code == 40) return;
			
			var theChar = String.fromCharCode(code);
			
			var currentTextString = that.tempText[that.currentLine].getText();
			var textBeforeCursor = currentTextString.substring(0, that.currentWordCursorPos);
			var textAfterCursor = currentTextString.substring(that.currentWordCursorPos, currentTextString.length);
			
			console.log(textBeforeCursor);
			console.log(textAfterCursor);
		
			var newTextString = textBeforeCursor + theChar + textAfterCursor;
			that.tempText[that.currentLine].setText(newTextString);
			
			that.currentWordCursorPos++;
			that.currentWordLetters++;
			
			console.log(that.currentWordCursorPos);
			console.log(that.currentWordLetters);
			
			
			
			// var theWord = that.tempText[that.currentLine].clone();
			// var wordW = theWord.getWidth();
			// var cursorX = that.cursorLine.getX();
			// var curText = theWord.getText();
		// 			
			// theWord.setText(curText.substring(0,that.currentWordCursorPos));
			// cursorX = that.currentText.getX() + theWord.getWidth();
		// 			
			// var cursorLineX = cursorX;
			// var cursorLineY = that.tempText[that.currentLine].getY();
			// var cursorLineHeight = that.focusRectH-10;
		// 			
			// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
			
			that.detectCursorPosition();
			
			
			
			// var cursorLineX = that.currentText.getX() + that.currentText.getWidth() + 2;
			// var cursorLineY = that.currentText.getY();
			// var cursorLineHeight = that.focusRectH-10;
		// 			
			// that.cursorLine.setPoints([cursorLineX, cursorLineY, cursorLineX, cursorLineY+cursorLineHeight]);
			
			
			
			
			
			
			$.each(that.tempText, function(index, iterTempText) {
				if (iterTempText.getWidth() > that.maxWidth) that.maxWidth = iterTempText.getWidth();
			});
			
			// if (that.maxWidth < that.currentText.getWidth()) {
				// that.maxWidth = that.currentText.getWidth();
			// }
			
			if (that.maxWidth < that.tempText[that.currentLine].getWidth()) {
				that.maxWidth = that.tempText[that.currentLine].getWidth();
			}
			
			//that.focusRect.setWidth(80<that.maxWidth?that.maxWidth+20:100);
			
			// if (that.currentText.getWidth() >= that.maxWidth) {
				// that.focusRect.setWidth(80<that.currentText.getWidth()?that.currentText.getWidth()+20:100);
			// }
			
			if (that.tempText[that.currentLine].getWidth() >= that.maxWidth) {
				that.focusRect.setWidth(80<that.tempText[that.currentLine].getWidth()?that.tempText[that.currentLine].getWidth()+20:100);
			}
			
			that.focusRectW = that.focusRect.getWidth();
			
			that.focusLayer.draw();
			
			return false;
		});
	},
};
// extend Line
Kinetic.Global.extend(Kinetic.EditableText, Kinetic.Text);
