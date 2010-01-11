MooRTE
===========

Rich Text Editor Framework for Mootools.

Tiny, flexible, and does not use a IFrame.

![Screenshot](http://siteroller.net/projects/moorte/images/moorte_screenshot.jpg)

Dependencies:
----------
The basic buttons (bold, italic, etc) only require mootools-core.

Many other buttons buttons rely on 3rd party scripts.
[The popup in the "hyperlink" button uses StickyWin, the "Upload Button" uses FancyUpload, etc.]
They require Depender.js, which is used to load in each of these third-party scripts as needed.
See the Depender docs for the correct setup of these docs. The Demo folder of the download is setup correctly. 

How to use
----------
### Basic usage:
	$('myElement').moorte(options);


### Alternative usage:
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
	- To define your own skin, modify the existing styles or add another
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

### MooRTE.Path

This is the path to your sources.json file.<br>
By default, is "js/sources.json"

If you have your own folder structure, modify this path, or no plugins will work! 

    MooRTE.Path = 'Javascripts/2010/mootools/classes/experiments/moorte/scripts.json';
    $('myEl').moorte();`


### MooRTE.Elements

The MooRTE.Elements object can be extended.

To create a button (some random options, all are optional)
	MooRTE.Elements.extend({
		myButton:{
			img:     'path/to/myImg.jpg', 
			onLoad:  function(){alert("button loaded")},
			onClick: function(){alert("Hello World!")}},
			source:  function(){alert("3..2...1...*boom*")}
		})
	});

If your function relies on a 3rd party script, it should be included in the onLoad event as follows:
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
+ If the toolbar must show when a button on the menu is clicked, the button should have an onClick event.
+ If the toolbar should should also show when menu button is loaded, the onLoad should reference the onClick.
+ The toolbar should be passed in as an array where the first item is 'group' and the buttons object is the second.

	var myToolbar = {Toolbar:['bold','underline','italic']};
	MooRTE.Elements.extend({
		myMenuEntry:{
			text:'edit', 
			onLoad: 'onClick',
			onClick:['group',myToolbar]
		}			
	});

Contact:
---------
Due to a GITHUB issue, the cached version of this project was a broken one.<br>
Please redownload and test - this version should work.
If you have issues, please comment on the Google group (Sign up required to prevent spam bots.)
http://groups.google.com/group/moorte
or email me at siteroller - the at dingbat - gmail.
	
There are many more options, see the docs on the site.
