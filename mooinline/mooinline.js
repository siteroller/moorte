/* Copyright November 2008, Sam Goody, ssgoodman@gmail.com 
*   Licensed under the Open Source License
*
* 	Authors:		
*		Sam Goody (ssgoodman@gmail.com)
*		Ryan Mitchel (ryan@rtnetworks.net) - [regexs]
*	Credits:
*	Entirely based on the tutorial at: http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Great job, Olav!!
*	Ideas and inspiration: Guillerr from the Mootools IRC, MooEditable
*	Icons from OpenWysiwyg - http://www.openwebware.com
*	We really want your help!  Please join!!
*
*	Usage: 
*		new MooInline(); - applies to textareas and elements with the class "mooinline"
*		new MooInline('span.editMe', {inline:true}) - will make the spans with the class of editme editable inline.
*		new MooInline({defaults:['underline,italics','bold,HelloWorld,JustifyLeft,JustifyRight']}) - 2 toolbars: the first with underline and italics.  The second with bold, a custom defined button, and 2 justify options.
*	Extending:
*		MooInline.Buttons.extend({
*			'HelloWorld':{img:'images/smiley.gif', title:'please click', click:function(){alert('hello World!')}},
*		})
*		
*	Usage Options (default is first on list):

*		floating: [true, false] - If true, bar will float above DOM, and not interfere with layout.  Otherwise it will insert the bar into the dom before the element.  
*		defaults: [comma delimitted string or array of strings, where each string is a row of buttons.  Defaults to 'Main,File,Link,Justify,Lists,|,Indents,Html/Text']
*		location: ['elements', 'inline', 'pageBottom', 'pageTop', none]  elements adds a bar to each element passed in.  'inline' acts like elements but shows the bar only on selection, and remove it onblur.  Only one bar is created. 
*											pageTop and pageBottom shows one bar for whole page, and the location can be edited via css.  None shows no bar, but shortcuts work.
*	
*	Extending:
*	Any properties in extended object will be passed into the new button.  The following are predefined and have special meaning (All are optional):
*		img:   [If a number, defaults to 'images/i.gif'. If opens toolbar, defaults to image of first button in toolbar.  Otherwise, no default] background image
*		shortcut: [no default] keyboard shortcut.  All shortcuts are initialized when editor is created, even if the buttons are not yet showing.
*		element:[if type is 'text','submit',or 'password', defaults to input.  Otherwise defaults to 'a'] element type
*		title: [defaults to object key, or to object key plus " Menu" if button opens toolbar.  If has shortcut, defaults to object key plus (Ctrl+shortcut).  ]
*		init:  [If array, will create a toolbar with those buttons.  Otherwise, defaults to none.] event to be called when button is initialized on the screen.
*		click: [If array, will create a toolbar with those buttons.  Otherwise, defaults to the 'document.execute' command] the mousedown event when the button is pressed,
*		args:  [defaults to object key] arguments to be passed to click event, 
*		Both init & click are passed the args, followed by a reference to the class.  
*		Within the function(args,classReference): The active button is 'this', the toolbar is this.getParent('.miMooInline');.  The active field is t.activeField, an array of all fields associated with the bar is t.fields. 
*		
*
*	Outline of the MooInline function:
*		1. initialize, implements, & options - built in mootools class tools.  See instructions for list of options.
*		2. exec, getRange, setRange - utility functions for the browser's built it editing tools. 
*		3. insertRTE - creates an empty div which will have the Rich Text Editor placed into it.
*			insertToolbar - creates empty div on page for each instance of MooInline, then calls 'toolbar' to inserts toolbars into said empty div.
*			positionToolbar - places said div wherever it should go on page.
*			textArea - if MooInline is applied to textarea, called to replace textarea with element. 
*			updateBtns - called whenever a key or the mouse is pressed. Checks which buttons should appear depressed.
*		4. toolbar - creates toolbar with passed in buttons.
*		5. clean - cleans up passed in html before submitting to prevent xss attacks.  Accepts optional xhtml & semantics options.  Utility is not actually used by MooInline.
*		
*/

var MooInline = new Class({
	
	Implements: [Options],

	options:{
		floating: false,
		location: 'elements', 														//[e,n,T,B,'']
		defaults: 'Defaults'
	},
	
	initialize: function(selectors, options){
		this.setOptions(options);	
		var self = this, mi, els = $$(selectors||'textarea, .mooinline'), l = this.options.location.substr(4,1).toLowerCase();
		MooInline.shortcuts = MooInline.shortcutBtns = MooInline.activeField = MooInline.activeBtn = [];
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !mi) mi = self.insertToolbar(l);  							//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true).focus();		//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,mi) : el.addEvents({				//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, mi); },
				'blur':function(){ 
					mi.addClass('miHide'); this.set('contentEditable', false);	
				}
			});
			el.store('bar', mi).addEvents({
				'mouseup':MooInline.Utilities.updateBtns, 
				'keydown':MooInline.Utilities.updateBtns, 
				'focus':function(){ MooInline.bar = this.retrieve('bar'); }
			});
		})
		MooInline.Utilities.activeField = els[0];									//in case a button is pressed before anything is selected.
		if(l=='t') mi.addClass('miPageTop').getFirst().addClass('miTopDown');
		else if(l=='b') mi.addClass('miPageBottom');
	},
	
	insertToolbar: function (pos){
		var mi = new Element('div', {'class':'miRemove miMooInline '+(!pos||pos=='n'?'miHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'miRTE' })
		).inject(document.body);
		$splat(this.options.defaults).map(function(i){return i.split(',')}).each(
			function(buttons, index){MooInline.Utilities.addCollection(buttons,[mi.getFirst(), 'bottom', 'Top'], 0, [])}
		);

		return mi;
	},
	
	positionToolbar: function (el, mi){												//function is sloppy.  Clean!
		el.set('contentEditable', true).focus();
		var elSize = el.getCoordinates(), f=this.options.floating;
		mi.removeClass('miHide').setStyle('width',elSize.width).store('field', mi.retrieve('field', []).include(el));
		if(f) mi.setStyles({ 'left':elSize.left, 'top':(elSize.top - mi.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('miFloat').getFirst().addClass('miFloat');
		else mi.inject((el.getParent().hasClass('miTextArea')?el.getParent():el),'before');
	},
	
	textArea: function (el){
		var div = new Element('div', {text:el.get('value')});
		new Element('div', {'class':'miTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
		el.addClass('miHide');
		return div;
	}
})

MooInline.Utilities = {
	exec: function(args){
		args = $splat(args);
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2).toLowerCase()));	//Fix for FF3 bug for justify, in&outdent
		if(g) document.designMode = 'on';
		document.execCommand(args[0], args[2]||false, args[1]||null);  				//document.execCommand('justifyRight', false, null);
		if(g) document.designMode = 'off'
	},
	
	getRange:function(){
		if(miRangeSelection != 'undefined') console.log( 1 )
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		this.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function() {
		if(this.range.select) this.range.select(); 
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			miRangeSelection = sel;
			if (sel.addRange){
				sel.removeAllRanges();
				sel.addRange(this.range);
			}
		}
 
		var url = $('miLink').get('value') || "";
		MooInline.utilities.exec(['createlink',url]);
		//var url = window.prompt("Enter an URL:", "."); document.execCommand('createlink', false, url);
	},
	
	updateBtns: function(e){
return	
	var bar = MooInline.bar, be, btn;
		console.log(bar);
		var vv = [	'bold','italic','underline','strikethrough','subscript','superscript','justifyleft','justifycenter',
			'JustifyRight','justifyfull','insertorderedlist','insertunorderedlist','unlink'
		]
		vv.each(function(prop){		
				if (be = bar.getElement('.mi'+prop))
					window.document.queryCommandState(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		})
		[''].each(function(prop){	
			if (be = bar.getElement('.mi'+prop))
				window.document.queryCommandValue(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		}) 
		if(e && e.control && (btn = MooInline.shortcuts.indexOf(e.key))>-1){ 
			e.stop(); 
			btn = bar.getElement('.mi'+t.shortcutBtns[btn])
			btn.fireEvent('mousedown', btn)
		}
	},
	
	addCollection: function(buttons, place, invisible, group){
		//div.MooInline[absPos. height:0] > div.miRTE[absPos height:auto] > div.miR0[?] > div.miTop[div collection] > a.miMain[a button]. - byebye r0!
		
		if ($type(place) == 'element') place = [place.getParent(),'after', place.get('class').match(/mi(?!Selection)[^\s]+/)[0]];
		var self = this, collection = place[0].getParent().getElement('.miCollection_'+place[2]), img, args;
		function run(prop, args, self, group){
			if(!prop) return;
			console.log('group: ',group);
			switch($type(prop)){
				case 'function':prop.bind(self)(args); return; 
				case 'array': MooInline.Utilities.addCollection(prop, self, 0, group); break;			
				case 'string': MooInline.Utilities[prop].bind(self)(args); break;
			}
		}
		
		if(!collection){
			collection = new Element('div', {'class':'miCollection_'+(place[2]||Math.random())}).inject(place[0], place[1]);//caller, (noBtn?'bottom':'after')//.store('caller')
			buttons.each(function(btn){
				var bgPos = 0, val = MooInline.Buttons[btn]; 
				if(!isNaN(val.img)){ bgPos = val.img; img = 'mooinline/images/i.gif' };						//if number, image is assumed to be default, position is number
				
				var properties = $H({
					href:'javascript:void(0)',
					unselectable: 'on',
					'class':'mi'+(val.title||btn),															//Will apply the first that exists: mi + [class, title, key] 
					title: btn + (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':''),	
					styles:img ? {'background-image':'url('+img+')', 'background-position':(-2+-18*bgPos)+'px -2px'}:'',
					events:{
						'mousedown': function(e){					
							if(!val.click && (!val.element || val.element == 'a')) MooInline.Utilities.exec(args||btn);
							run(val.click, val.args, this, buttons)
							if(e && e.stop)e.stop();
							
							this.getParent().getChildren().removeClass('miSelected');
							if(!val.ignoreState)this.addClass('miSelected');
						}
					}
				}).extend(val);
				['args','shortcut','element','click','img','onLoad','onExpand','onHide',(val.element?'href':'null')].map(properties.erase.bind(properties));
				var e = new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'a'), properties.getClean()).inject(collection);
				
				run(val.onLoad, val.args, e, [])	
				if(val.shortcut){MooInline.shortcuts.include(val.shortcut); MooInline.shortcutBtns.include(btn);} 
				if(collection.getCoordinates().top < 0)toolbar.addClass('miTopDown'); //untested!!
			})
		}
		var par = collection.getParent('.miRTE');
		for(i=0; i<group.length; i++){
			var el = par.getElement('.miCollection_mi'+group[i]);
			if(el)el.addClass('miHide')
		}
		if(!invisible)collection.removeClass('miHide')
	},
	
	clean: function(html, xhtml, semantic){
		
		$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
	
		var br = '<br'+(xhtml?'/':'')+'>';
		var xhtml = [
			//[/(<(?:img|input|br)[^/>]*)>/g, '$1 />'] 					// if (this.options.xhtml)//make tags xhtml compatable
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],			//remove divs from <li>
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],					//remove stupid apple divs
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>'],
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	// Semantic conversion.  Should be separate array that is merged in if semantic is set to true.
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>']
		];
		var cleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],		// Webkit cleanup
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],	// should be corrected, not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],
			[/<span style="">/gi, ''],
			[/<br\s*\/?>/gi, br],										// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],											// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],											// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],											// Remove leading BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],		// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],				// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],
			[/<p>\W*<\/p>/g, ''],										// Remove ps with other stuff, may mess up some formatting.
		];
		if(xhtml)cleanup.extend(xhtml);
		if(semantic)cleanup.extend(semantic);
		cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });
		return source;
	}
}


MooInline.Buttons = new Hash({

	'Defaults'     :{onLoad:['Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar']},	//group - defaults
	'Main'         :{click:['bold','italic','underline','strikethrough','subscript','superscript'], img:'0'},//console.log()//group - 'Main','File','Link','Justify','Lists','Indents','|','Html/Text','fuUploadBar'
	'File'         :{click:['paste','copy','cut','redo','undo'], img:9},
	'Link'         :{click:['l0','l1','l2','unlink'], img:'6', checkState:true},
	'Justify'      :{click:['justifyleft','justifycenter','JustifyRight','justifyfull'], img:18},
	'Lists'        :{click:['insertorderedlist','insertunorderedlist'], img:22},
	'Indents'      :{click:['indent','outdent'], img:16},//, init:function(){ console.log(this); this.fireEvent('mousedown')} },
	
	'|'            :{text:'|', title:'', element:'span'},
	'bold'         :{img:'0', shortcut:'b' },
	'italic'       :{img:'1', shortcut:'i' },
	'underline'    :{img:'2', shortcut:'u' },
	'strikethrough':{img:'3', shortcut:'s' },
	'subscript'    :{img:'4'},
	'superscript'  :{img:'5'},
	'indent'       :{img:'16'},
	'outdent'      :{img:'17'},
	'paste'        :{img:'9', title:'Paste (Ctrl+V)'},
	'copy'         :{img:'7', title:'Copy (Ctrl+C)'},
	'cut'          :{img:'8', title:'Cut (Ctrl+X)'},
	'redo'         :{img:'13', shortcut:'Y' },
	'undo'         :{img:'12', shortcut:'Z' },
	'justifyleft'  :{img:'20', title:'Justify Left'  },
	'justifycenter':{img:'18', title:'Justify Center'},
	'JustifyRight' :{img:'21', title:'Justify Right' },
	'justifyfull'  :{img:'19', title:'Justify Full'  },
	'insertorderedlist'  :{img:'22', title:'Numbered List'},
	'insertunorderedlist':{img:'23', title:'Bulleted List'},
	'test'         :{click:function(){console.log(arguments)}, args:this},
	'unlink'       :{img:'6'},
	'l0'           :{'text':'enter the url', element:'span' },
	'l1'           :{'type':'text',  events:{ 'mousedown':function(){ MooInline.Buttons.classReference.getRange(); }}, 'id':'miLink', unselectable: 'off' }, 
	'l2'           :{'type':'submit', 'click':function(args,classRef){ classRef.setRange() }, 'value':'add link' },
	'nolink'       :{'text':'please select the text to be made into a link'},
	'remoteURL'    :{click:['imgSelect','imgInput','insertimage']},
	'imgSelect'    :{element:'span', text:'URL of image' },
	'imgInput'     :{type:'text' },
	'insertimage'  :{click:function(args, classRef){ 
						classRef.exec([this.getParent().getElement('input[type=text]').get('text')]) 
					}},
	'inserthorizontalrule':{img:'22'},	
	'save'         :{ img:'11', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send($H({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}},
	'Html/Text'    :{ img:'26', click:['DisplayHTML']}, 
	'DisplayHTML'  :{ element:'textarea', 'class':'displayHtml', unselectable:'off', init:function(){ 
						var el=this.getParent('.miMooInline').retrieve('field'), p = el.getParent(); 
						var size = (p.hasClass('miTextArea') ? p : el).getSize(); 
						this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
					}},
	'colorpicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
						//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
						var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
						for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
						c[1] = -(c[2] - 255*saturation);
						var hex = c.rgbToHex();
					}},
	'fuUploadBar1' :{ click:['fuBrowse', 'fuUpload', 'fuClear','fuStatus','fuList'], title:'Upload Image' },
	'fuUploadBar'  :{ title:'Upload Image', img:25, click:function(args, classRef){
						classRef.toolbar(this.getParent('.miRTE'),'0_','fuUploadBar',['fuBrowse', 'fuUpload', 'fuClear','fuStatus','fuList'])
					}},
	'fuBrowse'     :{ id:"fuBrowse", click:function(){}, element:'span', text:'Browse Files', title:''},
	'fuUpload'     :{ id:"fuUpload", click:'', element:'span', text:'Upload Files', title:''},
	'fuClear'      :{ id:"fuClear", click:function(){console.log('clear here')}, element:'span', text:'Clear List' ,title:''},	
	'fuStatus'     :{ element:'span', id:'fuStatus', init:function(){
						this.adopt(
							new Element('strong', {'class':'overall-title'}),
							new Element('strong', {'class':'current-title'}),
							new Element('div', {'class':'current-text'}),
							new Element('img', {'class':'progress overall-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' }),
							new Element('img', {'class':'progress current-progress', src:'mooinline/plugins/fancyUpload/assets/progress-bar/bar.gif' })
						)
					}},
	'fuList'       :{ id:'fuList', style:'display:none', init:function(){
						Asset.javascript('mooinline/plugins/fancyUpload/fancyUpload.js');
						Asset.css('mooinline/plugins/fancyUpload/fancyUpload.css');
					}},
	'fuPhotoUpload':{ id:'demo-photoupload', element:'input', type:'file', name:'photoupload' },
	'loading..'    :{ 'class':'miLoading', 	element:'span', text:'loading...',title:''}
})


/* Ideapad:
a) add variable to signify whether or not buttons should be run, 
b) add postInit that is run after buttons are init'd.
c) addCollection takes as the second parameter the object after which to put the toolbar.  It must exist, so we will now manually create it for init, and must modify buttons to send along parent
d) create a subfunction that calls toolbar and use it instead in the mousedown function.
e) should there be an init before any buttons are pressed, and a expanded() when all are, or a different set of rules for init on menus?
f) extend elements with .mooInline() if option is set.
g) some way for new groups to be made on the same row as the old groups are (like toolbars in word)
h) onIint:expand() and expandHidden should expand.
i) add an onExpand, onExpandHidden and onCollapse, and a onCollapse function
j) defualt styles for a etc should be added to api docs
k) press btn which will press key / expand menu, and run optional function afterwards.
l) add object of functions it should check on each update key {widetBtn:function(){widteVar?true:false;}}
m) Add support for args to be a function. Run function for value of args.
n) Allow defaults to have spaces when passed in.
o) editing functions should not work out of the scope of the toolbar's fields (I shouldn't be able to click on a button on the "wrong" toolbar, and certainly not a field is not meant to be editable.)
p) the defaults when passed in shopuld have all the new flexibilty scheduled for the hash.
q) if a input/textarea, unselectable should be off.
r) 

Design Decisions:
a) Logic of button check:
	at press, all other buttons within it's collection are reset.
	if execBtn - will be redepressed as needed.
	ignoreState == false, btn will show itself as pressed until reset (either by user function or by other button in collection being pressed). 
	ignoreState == true, button will not "press".  if a string, variable will be added to that which updateBtns checks on each press  [perhaps using the collection?].
b) What parameters should addCollection require?
	a) Currently handles following: a) buttons to add to collection.  b & c) placing d) name e) visibilty f) caller.
	Ideally should not require so much: 
		Buttons(cannot just pass location, as this is more flexible, and any button can have button list in more than one place)
		Containing div (key of object).  Optional, as it will use a plain div (with the styles of a tollbar from openwysiwyg) if none is passed.
		Group which the containing div is a part of.  -  explain - should groups be maintained separately?
		
c) More work on groups / collections. 	
d) should defaults be dynamically added to the buttons hash if different?
e) some way of applying classes, events. etc to collections (add to hash?)
f) Expand the 'collection' array object. 
	a) It already can be called onLoad and onClick.  Add to args?
	b) Allow it to be an object, where the key refers to the containing element.  {main:['bold', 'italics']} becomes <div class="miCollection_Main"><a class="miBold">..
	c) Allow it to have within it nested arrays: [['main','bold'],['italics']] where each will expand.
		If done correctly, this should make it infinitely more flexible (and confusing?)
g) Alternatively, should there be a contains tag which allows subgroups to be expanded to be run?
h) Should there be a postFunc that runs after function is run?
	a) to create the subdialogs, using postfunc.
j) Add invisible parameter to make invisible? or rely on adding the miHide class
k) Can onLoad be told to run 'click'?
		
Bugs:
a) Throws an error sometimes when inline
b) when inline - clicking the bar should not make it dissapear!!
*/
			
/*
ChangeLog:
34:
1. WontFix - calculate num in toolbar function instead of requiring.
2. Added float:false, and change to default.
3. Add "insert picture" button
4. Consider ways to bound size of toolbars.
5. change variable name of updateBtns function
6. Work on bug with addLink, and bug with init:indent function / bind button to button object

35:
a) rename toolbar to collection
b) if click returns an array, it will not run toolbar (but wrote and greyed out line, can be reconsidered.

38:
a) renamed collection to addCollection
b) moved defaults into the buttons hash, allowing for onLoad
c) onLoad runs before subCollections are run
d) only put page in design mode for justify and indent
e) toolbar should not display when set to none
f) All collections are now within the same div
g) Each collection should be part of a group - by default named after the collection - of which only one from each group can show at a time.
h) rejected - expandHidden
i) rejected - change numbering system to 123 for toolbars and abc for subbars.
j) Removed the default behavior of opening subcollections that have shortcuts related to them.
*/

/*
addToolbar: function(toolbar, level, row, buttons, invisible){
		//div.MooInline > toolbar[div.miRTE] > parent/level[div.miR0] > bar/row[div.miTop] > a.miMain. 
		var t = this, bar, parent = toolbar.getElement('.miR'+level) || new Element('div',{'class':'miR'+level}).inject($(toolbar));
		MooInline.bar = toolbar.getParent();
		
		if(!(bar = parent.getElement('.mi'+row+'_toolbar'))){ //'.'+row
			bar = new Element('div', {'class':'mi'+row+'_toolbar'}).inject(parent);
			buttons.each(function(btn){
				var x = 0, val = ($type(btn)=='array' ? {'click':btn} : MooInline.Buttons[btn]), flyout = ($type(val.click) == 'array'); 
				var img = flyout && !val.img ? MooInline.Buttons[val.click[0]].img : val.img;  
				if($type(img*1) == 'number'){ x = img; img = 'mooinline/images/i.gif' };
				
				var properties = $H({
					href:'javascript:void(0)',
					unselectable: 'on',
					'class':'mi'+(val.title||btn),
					title: btn + (flyout ? ' Menu' : (val.shortcut ? ' (Ctrl+'+val.shortcut.capitalize()+')':'')),	
					styles:img ? {'background-image':'url('+img+')', 'background-position':(-2+-18*x)+'px -2px'}:'',
					events:{
						'mousedown': function(e){ 
							flyout ? MooInline.Utilities.addCollection(toolbar,level+'_',btn,val.click) : (val.click || t.exec).bind(this)(val.args||btn, t);//btn
							if(e && e.stop)e.stop();
							
							//rework logic - will not always do as expected.
							this.getParent().getElements('a').removeClass('miSelected');
							if(val.checkState)this.addClass('miSelected');
							MooInline.Utilities.updateBtns();
						}
					}
				}).extend(val);
				['args','shortcut','element','click','img','init',(val.element?'href':'null')].map(properties.erase.bind(properties));
				var e = new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'a'), properties.getClean()).inject(bar);
				if(val.shortcut){MooInline.shortcuts.include(val.shortcut); t.shortcutBtns.include(btn);}
				if(flyout && val.click.some(function(item){ return MooInline.Buttons[item].shortcut })) MooInline.Utilities.addCollection(toolbar,level+'_',btn,val.click,1)
				if(val.init) val.init.run([val.args||btn, t], e);
				if(toolbar.getCoordinates().top < 0)toolbar.addClass('miTopDown'); //untested!!
			})
		};
		
		var n = toolbar.retrieve(level);
		if(n) n.setStyle('display', 'none')
		toolbar.store(level, bar);
		bar.setStyle('display', (invisible ? 'none' : 'block')); //update to use effects	
	},
	
	
		//console.log($type(place))
		//console.log('in addCollection - place: ',place)
		//console.log('in addCollection - collection: ',collection)
		//if place is an array, collection is 
		//if(!caller) caller = MooInline.Properties.activeBtn.getParent('.miRTE');  //incorrectly using caller to refer to caller's parent
		//var miRTE = (noBtn ? caller : caller.getParent('.miRTE')); //clean!!
		//, collection =  caller.getParent('.miRTE').getElement('.miCollection_'+caller);
		//MooInline.bar = place;
		//MooInline.bar = collection;
		//.myElement.getNext('.miCollection_'+place);
		// if place is an array, adjust for place.  Otherwise assume it is a button.  Still not convinced if the button should be passed or set on click (partly what will be when auto-clicked)
		//console.log(!isNaN(val.img))
		//console.log(val)
		//console.log(collection)
		//if(val.click) val.click = expandFunc(val.click);
		//else 
		//console.log('vc', val)				
		//$each([val.onLoad, val.click], expandFunc)
		//if(val.onLoad)val.onLoad = expandFunc(val.onLoad);
		// console.log(val)						
		// console.log(this)	
		// console.log('out',val.img) console.log('in',val.img); console.log(val)
				// [val.onLoad, val.click].map(function(prop){ prop = expandFunc(prop); console.log('prop', prop)	 });
				//console.log('d')
				
				console.log('place0: ', place)
		console.log('addCollection: ',prop, args, self)
		console.log('collection: ', collection)
		console.log('place1: ', place)
			console.log('btn: ',btn)
			// val.click.bind(this)(val.args||btn);
							//flyout ? MooInline.Utilities.addCollection(val.click,this) : (val.click || self.exec).bind(this)(val.args||btn);//btn
							//if($type(r) == 'array') MooInline.Utilities.addCollection(r,this);						
							//MooInline.Utilities.updateBtns();
						//console.log('e');
						//if(flyout){
				//	if($type(val.onLoad)=='function') var run = val.onLoad.bind(e)(val.args||btn);  			//not using 'run' or 'attempt' as they crash if a variable is not defined.
				//	if($type(val.onLoad)=='string' || run=='expand') MooInline.Utilities.addCollection(val.click,e,val.expand=='hidden'?1:0)
				//}//console.log('f')//console.log('g')
				//Logic - check group that collection is part of.  hide all other bars within same group.  this group has file etc, should
		//collection.store(group, buttons);
		//var caller = MooInline.Buttons[caller];
		//var group = caller.group || caller.click || caller.onLoad;
		//var group = collection.retrieve('group') || [];
		//
		// .getElements(.addClass('miHide');//+group[i]
		//for(i=0; i<group.length; i++) collection.getParent().getElements('[class^=miCollection_]').addClass('miHide');//+group[i]
		//if(!invisible) collection.removeClass('miHide'); //update to use effects
		//if(n) n.setStyle('display', 'none')
		//toolbar.store(group, bar);
		//bar.setStyle('display', (invisible ? 'none' : 'block')); //update to use effects	
		console.log('group', group)
			//console.log(this.getParent());
							//for(i=0; i<buttons.length; i++){
							//	var el = par.getElement('.mi'+buttons[i]);
							//	if(el)el.removeClass('miSelected')
							//}						
		
				
*/