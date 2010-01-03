MooRTE
===========

Rich Text Editor Framework for Mootools.

Tiny, flexible, and does not use a IFrame.

![Screenshot](http://siteroller.net/projects/moorte/images/moorte_screenshot.jpg)


Dependencies:
----------
If you use only the basic buttons (bold, italic, etc), MooRTE just needs mootools-core.

However, this class was built to take advantage of other scripts. 
The popup in the "hyperlink" button uses StickyWin, the "Upload Button" uses FancyUpload, etc.
Depender.js is used to load in each of these third-party scripts as needed.
For many of the buttons, you must include Depender.js and have it setup correctly!

How to use
----------
### Basic usage:
	$('myElement').moorte(options);
	new MooRTE(options);

Alternative usage:
### Alternative:
	// a group of elements
	$$('.myElements').moorte(options);
	// single, group, or to apply to the page.
	var myRTE = new MooRTE(options);

	
Options
---------	
 - buttons: 'div.Toolbar':['bold','italic','underline]
    "buttons" can refer to anything in the MooRTE.Elements object.
	It will accept a JSON Object of any complexity, and is very loose in the definition.
	The Element object can be extended, see on.
 - skin: 'Word03'
    - This is a classname added to the MooRTE Element.
	- To define your own skin, just change or add another, and define CSS rules to match.
 - location: 'elements'
	- 'elements' - aplied above each passed in element.
	- 'inline' - Each of the passed in elements will assume an RTE when focused. The RTE will be removed when the element loses focus.
	- 'pageTop' - One RTE toolbar will be applied to the top of the page and will control all passed in elements.
	- 'PageBottom' - One RTE toolbar will be applied to the bottom of the page and will control all passed in elements.
	- 'none' - No visible toolbar will be applied, but keyboard shortcuts will still work.	
 - floating: false
	- Should the RTE be inserted into the element (affecting page layout) or should it float above it.
 - elements: 'textarea, .rte' - What elements should the RTE extend.
     - Only applicable when called with the new keyword [var mrte = new MooRTE({elements:'textarea'}) ])
	

Customization:
---------

### MooRTE.Elements

The MooRTE.Elements object can be extended.
To create a button (with some standard options, all are optional
	MooRTE.Elements.extend({
		myButton:{
			img:     'path/to/myImg.jpg', 
			onLoad:  function(){alert("button loaded")},
			onClick: function(){alert("Hello World!")}},
			source:  function(){alert("3..2...1...*boom*")}
		})
	});

If your function relies on a third party script, it should be included in the onLoad event as follows:
'scripts' may either be a path to your script, or the class name used by Depender (if you know how to set that up).
	MooRTE.Elements.extend({
		myButton:{
			onLoad: function(){
				MooRTE.Utilities.assetLoader({
					scripts: 'StickyWinModalUI',
					onComplete: function(){ alert("done") }
				})
			}
		}
	});
	
	
To define a custom toolbar:
	MooRTE.Elements.extend({
		myToolbar:{
			text:'edit', 
			onClick:['group',{Toolbar:['bold','underline','italic']}] 
	});
	
	
There are many more options, see the docs on the site.