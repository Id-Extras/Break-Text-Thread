// Break Text Thread	BS"D
// Copyright (c) 2020 Ariel Walden, www.Id-Extras.com. All rights reserved.
// This work is licensed under the terms of the MIT license.  
// The full text of the license can be read here: <https://opensource.org/licenses/MIT>.
// Version 1.0.0
//DESCRIPTION: InDesign makes breaking the thread between text frames without otherwise changing the layout surprisingly difficult! With this script, easily break the text thread (a) between selected text frames, or (b) between all frames in the selected story, or (c) throughout the document according to a selected paragraph style (great for dividing a long document into separate stories, one per chapter).
//TO USE: Run the script and select the appropriate option.
//TIP: If you place the text cursor inside some text  before running the script, the style dropdown will be preselected with the paragraph style under the text cursor.
//MORE INFO: For more information about this script and how to use it, please visit https://www.id-extras.com/break-text-thread/

/////////////////////////////////////////////
//   In Memoriam
//   RAPHAEL MYER WALDEN
//   1935-2019
/////////////////////////////////////////////

var gScriptName = "Break Text Thread Version 1.0.1 (by www.id-extras.com)";
var gFrameCounter = 0;
var gEndnoteCount = 0;
var gSelectedStyle;

try{
	app.doScript (main, undefined, undefined,UndoModes.ENTIRE_SCRIPT, gScriptName);
	// Force a screen refresh to show that the text frames are no longer linked (if "Show Text Threads" is on).
	app.menuActions.itemByName("$ID/Force Redraw").invoke();
	if (gFrameCounter > 0){
		alert("Number of threads broken: " + gFrameCounter, gScriptName);
	}
	if (gEndnoteCount != getEndnoteCount()){
		alert("W A R N I N G: You have lost some endnotes!!\r(This can happen if the thread between two frames of a single set of endnotes has been broken.)\r\rPress Ctrl-Z (or Cmd-Z on a Mac) to undo.", gScriptName);
	}
}
catch (e){
	alert (e + ". An error has occurred. The script will now quit.", gScriptName);
}

function main(){
	var allFrames, i, firstFrame, secondFrame, myFinds, result;
	// Before splitting the thread, keep track of the current number of endnotes in the document.
	getEndnoteCount();
	// Display UI.
	result = displayUI();
	// User cancelled.
	if (result === -1){
		return;
	}
	// Break thread to previous frame.
	if (result === 0){
		secondFrame = app.selection[0];
		if ((secondFrame instanceof TextFrame || secondFrame instanceof EndnoteTextFrame) == false){
			secondFrame = secondFrame.parentTextFrames[0];
		}
		if (secondFrame.previousTextFrame === null){
			alert("This is the first text frame in the story! Select a different frame and try again.", gScriptName);
			return;
		}
		firstFrame = secondFrame.previousTextFrame;
		breakThread(secondFrame, firstFrame);
		gFrameCounter = 1;
		return;
	}
	// Break thread to next frame.
	if (result === 1){
		firstFrame = app.selection[0];
		if ((firstFrame instanceof TextFrame || firstFrame instanceof EndnoteTextFrame) == false){
			firstFrame = firstFrame.parentTextFrames[0];
		}
		if (firstFrame.nextTextFrame === null){
			alert("This is the last text frame in the story! Select a different frame and try again.", gScriptName);
			return;
		}
		secondFrame = firstFrame.nextTextFrame;
		breakThread(secondFrame, firstFrame);
		gFrameCounter = 1;
		return;
	}
	// Break all threads in story.
	if (result === 2){
		allFrames = app.selection[0].parentStory.textContainers;
		gFrameCounter = allFrames.length - 1;
		for (i = gFrameCounter - 1; i >= 0; i--){
			breakThread(allFrames[i + 1], allFrames[i]);
		}
		return;
	}
	// Break thread before all text frames containing selected paragraph style.
	if (result === 3){
		app.findTextPreferences = null;
		app.findTextPreferences.appliedParagraphStyle = gSelectedStyle;
		myFinds = document.findText();
		for (i = myFinds.length-1; i >= 0; i--){
			secondFrame = myFinds[i].parentTextFrames[0];
			if (secondFrame == undefined) continue;
			firstFrame = secondFrame.previousTextFrame;
			if (firstFrame instanceof TextFrame || firstFrame instanceof EndnoteTextFrame){
				gFrameCounter++;
				breakThread(secondFrame, firstFrame);
			}
			// Since we have changed the text configuration in the document, it's best to reset myFinds.
			myFinds = app.activeDocument.findText();
		}
	}
}
	
function breakThread(secondFrame, firstFrame){
	var theStory, storyPrefs, firstPoint, lastPoint, textToCut, tempFrame;
	theStory = secondFrame.parentStory;
	// If the next text frame is empty because there's no more text in the story, or, indeed, if there is no text in the entire story, simply break the link between the two frames and return.
	if (firstFrame.insertionPoints.length == 0 || secondFrame.insertionPoints.length == 0){
		firstFrame.nextTextFrame = null;
		return;
	}
	storyPrefs = theStory.storyPreferences.properties;
	firstPoint = secondFrame.insertionPoints[0];
	lastPoint = theStory.insertionPoints[-1];
	textToCut = theStory.texts[0].insertionPoints.itemByRange(firstPoint, lastPoint);
	tempFrame = document.textFrames.add();
	textToCut.move(LocationOptions.atBeginning, tempFrame);
	firstFrame.nextTextFrame = null;
	// Now that the first frame is the last frame in its story, we can remove any final returns or column-break characters at the end of the last paragraph.
	if (firstFrame.parentStory.characters.length > 0){
		if (firstFrame.parentStory.characters[-1].contents == "\r" || firstFrame.parentStory.characters[-1].contents == SpecialCharacters.COLUMN_BREAK){
			firstFrame.parentStory.characters[-1].contents = "";
		}
	}
	tempFrame.nextTextFrame = secondFrame;
	tempFrame.remove();
	firstFrame.parentStory.storyPreferences.properties = storyPrefs;
	secondFrame.parentStory.storyPreferences.properties = storyPrefs;
}

function displayUI(){
	var w, b0, b1, b2, b3, stylesDropdown, result;
	b0 = {value: false};
	b1 = {value: true};
	b2 = {value: false};
	b3 = {value: false};
	if (app.selection[0] === undefined){
		alert("Please select a threaded text frame or some text and try again.", gScriptName);		
		return -1;
	}
	if (app.selection[0].hasOwnProperty("appliedParagraphStyle")){
		b3.value = true;
	}
	else if (app.selection[0] instanceof TextFrame || app.selection[0] instanceof EndnoteTextFrame){
		b1.value = true;
	}
	w = new Window("dialog", gScriptName);
	with (w){
		preferredSize.width = 500;
		with (add("panel")){
			alignment = ["fill", "fill"];
			alignChildren = ["fill", "fill"];
			spacing = 8;
			b0.widget = add("radioButton", undefined, "Break thread BEFORE selected frame");
			b1.widget = add("radioButton", undefined, "Break thread AFTER selected frame");
			b2.widget = add("radioButton", undefined, "Break ALL threads in selected story");
			b3.widget = add("radioButton", undefined, "Break thread before every frame with paragraph style: ");
			stylesDropdown = add("dropdownList", undefined, getAllStyleNames());
			stylesDropdown.alignment = ["right", "top"];
		}
		with (w.add("group")){
			alignment = ["fill", "fill"];
			alignChildren = ["right", "bottom"];
			add("button", undefined, "OK");
			add("button", undefined, "Cancel");
		}
	}
	b0.widget.value = b0.value;
	b1.widget.value = b1.value;
	b2.widget.value = b2.value;
	b3.widget.value = b3.value;
	stylesDropdown.selection = 0;
	stylesDropdown.onChange = function(){
		b3.widget.value = true;
	}
	if (b3.value){
		stylesDropdown.selection = stylesDropdown.find(getFullName(app.selection[0].appliedParagraphStyle));
	}
	result = w.show();
	// User pressed Cancel
	if (result === 2){
		return -1;
	}
	// User press OK.
	if (b0.widget.value == true){
		return 0;
	}
	if (b1.widget.value == true){
		return 1;
	}
	if (b2.widget.value == true){
		return 2;
	}
	if (b3.widget.value == true){
		gSelectedStyle = document.allParagraphStyles[stylesDropdown.selection.index];
		return 3;
	}
	return -1;
}


function getAllStyleNames(){
	var i;
	var s = [];
	var allStyles = document.allParagraphStyles;
	for (i = 0; i < allStyles.length; i++){
		s.push(getFullName(allStyles[i]));
	}
	return s;
}

// Get the name of the paragraph style prefixed by the names of its parent groups, if any.
function getFullName(styleObj){
	var climbing = styleObj.parent;
	var s = styleObj.name;
	var g = [];
	while (climbing instanceof ParagraphStyleGroup){
		g.push(climbing.name);
		climbing = climbing.parent;
	}
	if (g.length > 0){
		s = "[" + g.reverse().join(":") + "] " + s;
	}
	return s;
}

function getEndnoteCount(){
	if (document.stories.length == 0){
		gEndnoteCount = 0;
		return 0;
	}
	if (document.stories[0].hasOwnProperty("endnotes") == false){
		gEndnoteCount = 0;
		return 0 ;
	}
	gEndnoteCount = document.stories.everyItem().endnotes.length;
	return gEndnoteCount;
}
