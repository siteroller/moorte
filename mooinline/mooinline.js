/* Copyright November 2008, Sam Goody, ssgoodman@gmail.com 
*   Licensed under the Open Source License
*
* 	Authors:
*		Ryan Mitchel (ryan@rtnetworks.net) - [regexs]
*		Sam Goody (ssgoodman@gmail.com)
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
*		inline    : [false, true] - if set to true, MooInline will show onClick & hide onBlur.  Otherwise, MooInline will always show.
*		floating: [true, false] - If true, bar will float above DOM, and not interfere with layout.  Otherwise it will insert the bar into the dom before the element.  
*		defaults: [comma delimitted string or array of strings, where each string is a row of buttons.  Defaults to 'Main,File,Link,Justify,Lists,|,Indents,Html/Text']
*		location: ['multiple', 'follow', 'pageBottom', 'pageTop', none]  multiple adds a bar to each element passed in.  'single' creates only one bar.  If inline is true, bar will follow the user. 
*											pageTop and pageBottom will have one bar for whole page.  None has no bar.  Shortcuts work.
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
*		Within the function(args,classReference): The active button is 'this', the active field is t.activeField.  All fields associated with the bar is this.getParent('.mooInline').retrieve('fields') 
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
	
	Implements: [Events, Options],

	options:{
		floating: false,
		location: 'elements', //[e,n,T,B,'']
		defaults: 'Main,File,Link,Justify,Lists,Indents,|,Html/Text,fuUploadBar'
	},
	
	initialize: function(selectors, options){
		this.setOptions(options);	
		var self = this, mi, els = $$(selectors||'textarea, .mooinline'), l = this.options.location.substr(4,1).toLowerCase();
		this.shortcuts = []; this.shortcutBtns = [];
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = self.textArea(el);
			if(l=='e' || !mi) mi = self.insertToolbar();  						//[L]ocation == elem[e]nts. [Creates bar if none or, when 'elements', for each element]
			if(l=='b' || l=='t' || !l) el.set('contentEditable', true).focus();	//[L]ocation == page[t]op, page[b]ottom, none[] 
			else l=='e' ? self.positionToolbar(el,mi) : el.addEvents({			//[L]ocation == elem[e]nts ? inli[n]e
				'click': function(){ self.positionToolbar(el, mi); },
				'blur':function(){ 
					mi.addClass('miHide'); this.set('contentEditable', false);	//modify to prevent from disappearing when focus is moved to the toolbar.
				}
			});
			el.store('bar', mi).addEvents({
				'mouseup':MooInline.Utilities.updateBtns, 
				'keydown':MooInline.Utilities.updateBtns, 
				'focus':function(){ t.bar = this.retrieve('bar'); }
			});
		})
		MooInline.Utilities.activeField = els[0];								//in case a button is pressed before anything is selected.
		if(l=='t') mi.addClass('miPageTop').getFirst().addClass('miTopDown');
		else if(l=='b') mi.addClass('miPageBottom');
	},
	
	insertToolbar: function (){
		var mi = new Element('div', {'class':'miRemove miMooInline '+(i?'miHide':''), 'contentEditable':false }).adopt(
			 new Element('div', {'class':'miRTE' })
		).inject(document.body);
		$splat(t.options.defaults).map(function(i){return i.split(',')}).each(
			function(buttons, index){MooInline.Utilities.addToolbar(mi.getFirst(), index, 'Top', buttons)}
		);
		return mi;
	},
	
	positionToolbar: function (el, mi){									//function is sloppy.  Clean!
		el.set('contentEditable', true).focus();
		var elSize = el.getCoordinates(), f=this.options.floating;
		mi.removeClass('miHide').setStyle('width',elSize.width).store('field', mi.retrieve('field', []).include(el));
		if(f) mi.setStyles({ 'left':elSize.left, 'top':(elSize.top - mi.getFirst().getCoordinates().height > 0 ? elSize.top : elSize.bottom) }).addClass('miFloat').getFirst().addClass('miFloat');
		else mi.inject((el.getParent().hasClass('miTextArea')?el.getParent():el),'before');
	},
	
	function textArea(el){
		var div = new Element('div', {text:el.get('value')});
		new Element('div', {'class':'miTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
		el.addClass('miHide');
		return div;
	}
})

MooInline.Utilities = {
	exec: function(args){
		args = $splat(args);
		var g = (Browser.Engine.gecko && 'ju,in,ou'.contains(args[0].substr(0,2)));  //bug for justify in&outdent in FF3
		if(g) document.designMode = 'on';
		document.execCommand(args[0], args[2]||false, args[1]||null);  //document.execCommand('justifyRight', false, null);
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
		var bar = t.bar, be, btn;
		 
		[	'bold','italic','underline','strikethrough','subscript','superscript','justifyleft','justifycenter',
			'JustifyRight','justifyfull','insertorderedlist','insertunorderedlist','unlink'
		].each(function(prop){		
				if (be = bar.getElement('.mi'+prop))
					window.document.queryCommandState(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		})
		[].each(function(prop){	
			if (be = bar.getElement('.mi'+prop))
				window.document.queryCommandValue(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
		}) 
		if(e && e.control && (btn = t.shortcuts.indexOf(e.key))>-1){ 
			e.stop(); 
			btn = t.bar.getElement('.mi'+t.shortcutBtns[btn])
			btn.fireEvent('mousedown', btn)
		}
	},
	
	addToolbar: function(toolbar, level, row, buttons, invisible){
		//div.MooInline > toolbar[div.miRTE] > parent/level[div.miR0] > bar/row[div.miTop] > a.miMain. 
		var t = this, bar, parent = toolbar.getElement('.miR'+level) || new Element('div',{'class':'miR'+level}).inject($(toolbar));
		t.bar = toolbar.getParent();
		
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
							flyout ? MooInline.Utilities.addToolbar(toolbar,level+'_',btn,val.click) : (val.click || t.exec).bind(this)(val.args||btn, t);//btn
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
				if(val.shortcut){t.shortcuts.include(val.shortcut); t.shortcutBtns.include(btn);}
				if(flyout && val.click.some(function(item){ return MooInline.Buttons[item].shortcut })) MooInline.Utilities.addToolbar(toolbar,level+'_',btn,val.click,1)
				if(val.init) val.init.run([val.args||btn, t], e);
				if(toolbar.getCoordinates().top < 0)toolbar.addClass('miTopDown'); //untested!!
			})
		};
		
		var n = toolbar.retrieve(level);
		if(n) n.setStyle('display', 'none')
		toolbar.store(level, bar);
		bar.setStyle('display', (invisible ? 'none' : 'block')); //update to use effects	
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

	'Main'         :{click:['bold','italic','underline','strikethrough','subscript','superscript'], checkState:true},//console.log()
	'File'         :{click:['paste','copy','cut','redo','undo'], checkState:true},
	'Link'         :{click:['l0','l1','l2','unlink'], img:'6', checkState:true},
	'Justify'      :{click:['justifyleft','justifycenter','JustifyRight','justifyfull'], checkState:true},
	'Lists'        :{click:['insertorderedlist','insertunorderedlist'], checkState:true},
	'Indents'      :{click:['indent','outdent'], checkState:true},//, init:function(){ console.log(this); this.fireEvent('mousedown')} },
	
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
	'loading..'    :{ 'class':'miLoading', 	element:'span', text:'loading...',title:''},
	'defaults'     :{ init:['Main','File','Link','Justify','Lists','Indents','|','Html/Text','uploadBar']}
})


/* Ideapad:
a) perhaps if click returns an array, it should run toolbar?
b) Move defaults to the buttons hash, allow for init.
c) allow init before and after initializing buttons within.
d) add variable to signify whether or not buttons should be run, and remove the default behavior
e) add preinit, that is run before buttons are initd, and postinit for after.
f) change numbering system to 123 for toolbars and abc for subbars.
e) create a subfunction that calls toolbar and use it instead in the mousedown function.
f) should there be an init before any buttons are pressed, and a expanded() when all are, or a different set of rules for init on menus?
g) throws an error sometimes when inline
h) remove 'contentEditable' from page when func begins with ...
i) when inline - clicking the bar should not make it dissapear!!
j) by default btoolbar is showing - no good when 'none' is selected.
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
*/