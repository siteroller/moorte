/* Copyright November 2008, Sam Goody, ishtov@yahoo.com 
*   Licensed under the Open Source License
*
* 	Credits:
*	Entirely based on the tutorial at: http://dev.opera.com/articles/view/rich-html-editing-in-the-browser-part-1.  Great job, Olav!!
*	Ideas and inspiration: Guillerr from the Mootools IRC, MooEditable
*	Some regexes from MooEditable (Both the original and Ryan and Orefalo's excellent contributions).
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
*	Any properties in extended object will be passed into the new button.  The following are predefined and have special meaning (All are optional):
*		init:  [If array, will create a toolbar with those buttons.  Otherwise, defaults to none.] event to be called when button is initialized on the screen.
*		click: [If array, will create a toolbar with those buttons.  Otherwise, defaults to the 'document.execute' command] the mousedown event when the button is pressed,
*		args:  [defaults to object key] arguments to be passed to click event, 
*	Both init & click are passed the args, followed by a reference to the class.  Within the function(args,t): The active button is 'this', the active field is t.activeField.  All fields associated with the bar is this.getParent('.mooInline').retrieve('fields') 
*		img:   [If a number, defaults to 'images/i.gif'. If opens toolbar, defaults to image of first button in toolbar.  Otherwise, no default] background image
*		shortcut: [no default] keyboard shortcut.  All shortcuts are initialized when editor is created, even if the buttons are not yet showing.
*		element:[if type is 'text','submit',or 'password', defaults to input.  Otherwise defaults to 'a'] element type
*		title: [defaults to object key, or to object key plus " Menu" if button opens toolbar.  If has shortcut, defaults to object key plus (Ctrl+shortcut).  ]
*		
*/

var MooInline = new Class({
	
	Implements: [Events, Options],

	options:{
		xhtml   : true,
		semantic: true,
		inline  : false,
		floating: true,			// false not yet available!  Designed to either insert bar into DOM, or float above relevant element.   
		location: 'multiple', 	// 'single', 'pageBottom', none. 'pageTop' doesn't show yet, as it expands upwards off the page.
		defaults: 'Main,File,Link,Justify,Lists,|,Indents,Html/Text'
	},
	
	initialize: function(els, options){
		this.setOptions(options);	
		this.insertMI(els);
	},

	insertMI: function(selectors, toolbars){
	
		var t = this, els = $$(selectors||'textarea, .mooinline'), i = this.options.inline, l = this.options.location.substr(4,1).toLowerCase(), mi, shortcuts;
		this.shortcuts =[]; this.shortcutBtns = [];
		
		function insertToolbar(){
			var mi = new Element('div', {'class':'miRemove miMooInline '+(i?'miHide':''), 'contentEditable':false }).adopt(
				 new Element('div', {'class':'miRTE' })
			).inject(document.body);
			defaults.each(function(buttons, index){t.toolbar(mi.getElement('.miRTE'), index, 'miTop', buttons)});
			return mi;
		}
		function positionToolbar(el, mi){
			var p = el.getCoordinates();
			mi.setStyles({display:'block', width:p.width}); 
			var top = p.top - mi.getCoordinates().height; 
			mi.setStyles({ 'left':p.left, 'top':(top > 0 ? top : p.bottom) }).store('field',el);
			el.set('contentEditable', true).focus();
		}
		function textArea(el){
			var div = new Element('div', {text:el.get('value')});
			new Element('div', {'class':'miTextArea '+el.get('class'), 'styles':el.getCoordinates() }).adopt(div, new Element('span')).setStyle('overflow','auto').inject(el, 'before');
			el.addClass('miHide');
			return div;
		}
		var btnChk = ['bold','italic','underline','strikethrough','subscript','superscript','justifyleft','justifycenter',
						'JustifyRight','justifyfull','insertorderedlist','insertunorderedlist','unlink'];				
		var btnVal = [];
		updateBtns = t.updateBtns = function(e){
			var bar = t.bar, be, btn;	//console.log(window.document.QueryCommandEnabled)
			
			btnChk.each(function(prop){	
				if (be = bar.getElement('.mi'+prop))
						window.document.queryCommandState(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
			}); 
			btnVal.each(function(prop){
				if (be = bar.getElement('.mi'+prop))
					window.document.queryCommandValue(prop) ? be.addClass('miSelected') : be.removeClass('miSelected');
			}) 
			if(e && e.control && (btn = t.shortcuts.indexOf(e.key))>-1){ 
				e.stop(); 
				btn = t.bar.getElement('.mi'+t.shortcutBtns[btn])
				btn.fireEvent('mousedown', btn)
			}
		};
		
		var defaults = $splat(t.options.defaults).map(function(i){return i.split(',')});
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = textArea(el);
			console.log(el)
			if(l=='i' || !mi) mi = insertToolbar();  						//[L]ocation == mult[i]ple.
			if(!l || l=='b' || l=='t') el.set('contentEditable', true);		//none[], page[t]op, page[b]ottom
			else if(!i) positionToolbar(el, mi);							//[i]nline == false 
			else el.addEvents({
				'click': function(){ positionToolbar(el, mi); },
				'blur':function(){ mi.setStyle('display','none'); this.set('contentEditable', false);}
			});
			el.store('bar', mi).addEvents({'mouseup':updateBtns, 'keydown':updateBtns, 'focus':function(){t.bar = this.retrieve('bar'); }});
		})
		if(l=='b' || l=='t') mi.addClass('miPage'+l);
	},
	
	toolbar: function(toolbar, level, row, buttons, invisible){
		//div.MooInline > toolbar[div.miRTE] > parent/level[div.miR0] > bar/row[div.miTop] > a.miMain, 
		var t = this, bar, parent = toolbar.getElement('.miR'+level) || new Element('div',{'class':'miR'+level}).inject($(toolbar));
		t.bar = toolbar.getParent();
		
		if(!(bar = parent.getElement('.'+row))){ 
			bar = new Element('div', {'class':row}).inject(parent);
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
							flyout ? t.toolbar(toolbar,level+'_',btn,val.click) : (val.click || t.exec).bind(this)(val.args||btn, t);//btn
							if(e && e.stop)e.stop();
							
							//rework logic - will not always do as expected.
							this.getParent().getElements('a').removeClass('miSelected');
							this.addClass('miSelected');
							t.updateBtns();
						}
					}
				}).extend(val);
				['args','shortcut','element','click','img','init'].map(properties.erase.bind(properties));
				var e = new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'a'), properties.getClean()).inject(bar);
				if(val.shortcut){t.shortcuts.include(val.shortcut); t.shortcutBtns.include(btn);}
				if(flyout && val.click.some(function(item){ return MooInline.Buttons[item].shortcut })) t.toolbar(toolbar,level+'_',btn,val.click,1)
				if(val.init) val.init.run([val.args||btn, t], e);
			})
		};
		
		var n = toolbar.retrieve(level);
		if(n) n.setStyle('display', 'none')
		toolbar.store(level, bar);
		bar.setStyle('display', (invisible ? 'none' : 'block')); //update to use effects	
	},
	
	exec: function(args){
		var g;
		args = $splat(args);
		if(g=Browser.Engine.gecko) document.designMode = 'on';
		document.execCommand(args[0], args[2]||false, args[1]||null);  //document.execCommand('justifyRight', false, null);
		if(g) document.designMode = 'off'
	},	
		
	getRange:function(){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		this.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
	},
	
	setRange: function() {
		if(this.range.select) this.range.select(); 
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.addRange){
				sel.removeAllRanges();
				sel.addRange(this.range);
			}
		}
 
		var url = $('miLink').get('value') || "";
		this.exec(['createlink',url]);
		//var url = window.prompt("Enter an URL:", "."); document.execCommand('createlink', false, url);
	},
	
	clean: function(html){
		
		$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
	
		var br = '<br'+(this.options.xhtml?'/':'')+'>';
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
		if(this.options.xhtml)cleanup.extend(xhtml);
		if(this.options.semantic)cleanup.extend(semantic);
		cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });
		return source;
	}	
})

MooInline.Buttons = new Hash({

	'Main'         :{click:['bold','italic','underline','strikethrough','subscript','superscript']},//console.log()
	'File'         :{click:['paste','copy','cut','redo','undo']},
	'Link'         :{click:['l0','l1','l2','unlink'], img:'6'},
	'Justify'      :{click:['justifyleft','justifycenter','JustifyRight','justifyfull']},
	'Lists'        :{click:['insertorderedlist','insertunorderedlist']},
	'Indents'      :{click:['indent','outdent']},//, init:function(){ console.log(this); this.fireEvent('mousedown')} },
	
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
	'test'         :{click:function(){console.log(arguments)}},
	'unlink'       :{ img:'6'},
	'l0'           :{ 'text':'enter the url', element:'span' },
	'l1'           :{ 'type':'text',  events:{ 'mousedown':function(args,self){ self.getRange(); }}, 'id':'miLink', unselectable: 'off' }, 
	'l2'           :{ 'type':'submit', 'click':function(args,self){ self.setRange() }, 'value':'add link' },
	'nolink'       :{ 'text':'please select the text to be made into a link'},
	'save'         :{ img:'11', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send($H({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}},
	'Html/Text'    :{ img:'16', click:['DisplayHTML']}, 
	'DisplayHTML'  :{ type:'text', click:function(el, toolbar){ console.log('here'); console.log(el); console.log(toolbar); this.set({'styles':el.getCoordinates(), 'text':el.innerHTML.trim()})}},
	'colorpicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
						var lx = mouseLocation.x, ly = mouseLocation.y, Sy=sideSlider.y, b = this.get('width')/7, c=[];
						for(var i=0; i<3; i++){
							var n0=b*i-l,n1=l-b*(i+5);
							if((c[i]=n0<0||n1<0?0:n0<b?n0:n1)>b)c[i]=b; //if(x>b)x=b;x=n0<0||n1<0?0:n0<b?n0:n1;  //c'mon!! Prize for lack of legibility!!!
						}
						c[2]=b-c[2];
						for(var i=0; i<3; i++){
							x+=((256-x)/256)*Sy;
						}
					}}
})

/*
clean:
if($('modalOverlay')){ 
	debug('modal going'); 
	$('windowUnderlay').destroy();
	$('modalOverlay').destroy(); 
}else debug('no modal');


MooInline.Buttons.extend({
	'Open Siteroller.org Homepage':{'text':'SiteRoller', 'click':function(){ window.open('http://www.siteroller.org') }},
	'body'         :{'id':'miTrigger', 'text':'Edit Page', click:'place'},
	'file'         :{'text':'file'}, 
	'metadata'     :{'text':'metadata'},		
	'Save Changes' :{click:'save', shortcut:'s', 'class':'saveBtn', 'styles':{'width':'75px'} },
	'newBar'       :{click:'toolbar', args:''},
});

function debug(msg){ if(console)console.log(msg); else alert(msg) }
*/

/* 
'l2'           :{ 'type':'submit', events:{ 'click':    function(){ MooInline.Buttons.self.setRange(); }}, 'value':'add link' },
*/
/*
ChangeLog:
24:
1. Child toolbars should be named as an underscored digit instead higher numbers.  Toolbars will be numbered.
2. By convention, regular buttons are now lowercased, Toolbars are Uppercased.
3. All toolbars that have shortcuts within them (and perhaps in their children) should be loaded at startup (as otherwise the shortcuts would not be able to 'press' the buttons)
4. Shortcuts are now working.

25:
1. Cleanup.
2. Default buttons should be an array, where each string is a comma delimited list of buttons, and dynamic menus should be bracketed.
2. Make default load of toolbars to be with display none. 
5. Dynamic flyout buttons will be named and added to the Buttons hash for the duration of the page. 
6. Special properties removed from properties hash via map.
7. bind the elent with the call when shortcut is pressed.

29:
1. Fix - button now updates when pressed [Perfection perhaps in FF 3.1] (FF3) 
2. Move "init function" till after submneus have been created.

30:
1. Fix - Various workarounds for bugs in FF3 that were blocking certain commands (FF3).
2. Indent menu not working due to a bug in the update check (FF3)
3. Begin work on support for FF2 and a modal option.
4. More documentation.
*/