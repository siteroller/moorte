//Copyright Sam Goody  ishtov@yahoo.com 

var MooInline = new Class({
	
	Implements: [Events, Options],

	options:{
		xhtml   : true,
		auto    : true,
		inline  : false,
		floating: true,					// false not yet available!  Designed to either insert bar into DOM, or float above relevant element.   
		location: 'multiple', 			// 'single', 'pageBottom', none. 'pageTop' doesn't show, as it expands upwards off the page.
		toolbar : 'miTextEdit_1', 		// 'miMain_0' if auto is false
		imgPath : 'mooinline/images/',
		defaults: ['Main','File','Link','Justify','Lists','Indent']   
	},
	
	initialize: function(els, options){
		this.toolbars = {};
		this.setOptions(options);
		MooInline.Buttons.self = this;
		this.options.auto ? this.insertMI(els) : this.toolbar(this.options.toolbar);
	},

	insertMI: function(selectors, toolbars){
		
		var els = $$(selectors||'textarea, .mooinline'), i=this.options.inline, l=this.options.location.substr(4,1).toLowerCase(), t=this, mta;
		
		function insertToolbar(){
			var mta = new Element('div', {'class':'miRemove miMooInline '+(i?'miHide':''), 'contentEditable':false }).adopt(
				 new Element('div', {'class':'miWysEditor' }),
				 new Element('textarea', {'class':'miWygEditor miHide', 'type':'text' })
			).inject(document.body);
			t.toolbar({'miTop':t.options.defaults}, mta.getElement('.miWysEditor'));//t.options.toolbar
			return mta;
		}
		function positionToolbar(el, mta){
			var p = el.getCoordinates();
			mta.setStyles({display:'block', width:p.width}); 
			var top = p.top - mta.getCoordinates().height; 
			mta.setStyles({ 'left':p.left, 'top':(top > 0 ? top : p.bottom) });
			el.set('contentEditable', true).focus();
		}
		function insertEl(el){
			var div = new Element('div', {'class':'mtaTextArea '+el.get('class'), 'styles':el.getCoordinates(), text:el.get('value') }).inject(el, 'before');//el.get('styles'), 'styles':.extend() 
			el.addClass('miHide');
			return div;
		}
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = insertEl(el);
			if(l=='i' || !mta) mta = insertToolbar(); 
			if(!l || l=='b' || l=='t') el.set('contentEditable', true);
			else if(!i) positionToolbar(el, mta); else el.addEvents({
				'click': function(){ positionToolbar(el, mta);  },
				'blur':function(){ mta.setStyle('display','none'); this.set('contentEditable', false);}
			});
		})
		if(l=='b' || l=='t') mta.addClass('miPosition'+l);
	},
	
	toolbar: function(rowObj, toolbar){ 	

		var t = this, num = (t.active.num||0), an = 'active'+num, bar, top='', row = row.getKeys()[0], buttons = rowObj.row; //num = row.slice(-1),
		toolbar ? top =' miTop' : toolbar = t.active.toolbar;  
		
		var parent = toolbar.getElement('.miR'+num) || new Element('div',{'class':'miR'+num+top}).inject($(toolbar));
		if(!(bar = parent.getElement('.'+row))){ 
			bar = new Element('div', {'class':row}).inject(parent);
			buttons.each(function(key){  
				var val = MooInline.Buttons[key];
				var properties = new Hash({
					href:"#",
					styles:{val.img?({'background-image':'url('+t.options.imgPath+val.img.substr(0,1)+'.gif)', 'background-position':(16+16*key.substr(1))+'px 0'}):'' }, //-16
					title: key || val.args,
					unselectable: 'on',
					events:{
						'mousedown': function(e){ 
							e.stop(); 
							t.active = this.getParent('.miWysEditor')
							val.click ? ($type(val.click)=='string' ? t[val.click] : val.click).run(val.args||key||val.title,t) : t.exec(val.args||val.title) //run(val.args..)..
						}
					}
				}).extend(val).erase('args').erase('shortcut').erase('element').erase('click').erase('img').getClean();
				var btn = new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'a'), properties).inject(bar);
				if (val.click) bar.addEvent('keydown', function(){ if (event.key == val.shortcut && event.control) val.click });//change to switch
			})
		}
		var n = toolbar.retrieve(num);
		if(n) n.setStyle('display', 'none')
		toolbar.store(num, bar);
		bar.setStyle('display', 'block'); //update to use effects	
	},
	
	exec: function(args){
		args = $splat(args);
		document.execCommand(args[0], args[2]||false, args[1]||null);  //document.execCommand('justifyRight', false, null);
	},	
		
	getRange:function(){
		var sel = window.getSelection ? window.getSelection() : window.document.selection;
		if (!sel) return null;
		this.range = sel.rangeCount > 0 ? sel.getRangeAt(0) : (sel.createRange ? sel.createRange() : null);
		//try { return s.rangeCount > 0 ? s.getRangeAt(0) : (s.createRange ? s.createRange() : null); } catch (e) { /IE bug when used in frameset/ return this.doc.body.createTextRange(); }
	},
	
	setRange: function() {
		if(this.range.select) this.range.select(); //$try(function(){ this.range.select(); });
		else{
			var sel = window.getSelection ? window.getSelection() : window.document.selection;
			if (sel.addRange) {
				sel.removeAllRanges();
				sel.addRange(this.range);
			}
		}
 
		var url = $('miLink').get('value') || "";
		this.exec(['createlink',url]);
		//var url = window.prompt("Enter an URL:", "."); document.execCommand('createlink', false, url);
	},
	
	clean: function(source){
		if($('modalOverlay')){ 
			debug('modal going'); 
			$('windowUnderlay').destroy();
			$('modalOverlay').destroy(); 
		}else debug('no modal');
		
		$$('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) $el.replaces(p)  });
		//$$('br:last-child').each(function(el){ if(!el.nextSibling && 'h1h2h3h4h5h6lip'.contains(el.getParent().get('tag'))) el.destroy(); });
		//$$('br:last-child').filter(function(el) { return !el.nextSibling; })
	
		var br = '<br'+(this.options.xhtml?'/':'')+'>';
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
			//[/(<(?:img|input|br)[^/>]*)>/g, '$1 />'] 					// if (this.options.xhtml)//make tags xhtml compatable
			[/<p>\W*<\/p>/g, ''],										// Remove ps with other stuff, may mess up some formatting.
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	// Semantic conversion.  Should be separate array that is merged in if semantic is set to true.
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>']
		];
		cleanup.each(function(val, key){ console.log(val); source = source.replace(val[0], val[1]); });
		return source;
	}
})

//reserved keywords: { args:[defaults to key than to title] arguments to be passed to click event, click: 'click'event,
// img:background image, shortcut:keyboard shortcut, element:[defaults to 'a'] element type}
//If type is 'text','submit',or 'password', element is assumed to be a 'input'.
//All other key/vals will be passed in to the new Element() and override any default values set.   	
MooInline.Buttons = {
	'Bold'         :{ img:'a0', shortcut:'b' },
	'Italic'       :{ img:'a1', shortcut:'i' },
	'Underline'    :{ img:'a2', shortcut:'u' },
	'Strikethrough':{ img:'a3', shortcut:'s' },
	'Subscript'    :{ img:'a5'},
	'Superscript'  :{ img:'a6'},
	'Indent'       :{ img:'i0'},
	'Outdent'      :{ img:'i1'},
	'Paste'        :{ img:'f0'},
	'Copy'         :{ img:'f1'},
	'Cut'          :{ img:'f2'},
	'Redo'         :{ img:'f3', shortcut:'y' },
	'Undo'         :{ img:'f4', shortcut:'z' },
	'JustifyLeft'  :{ img:'j3', title:'Justify Left'  },
	'JustifyCenter':{ img:'j2', title:'Justify Center'},
	'JustifyRight' :{ img:'j1', title:'Justify Right' },
	'JustifyFull'  :{ img:'j0', title:'Justify Full'  },
	'InsertOrderedList'  :{img:'u0', title:'Numbered List'},
	'InsertUnorderedList':{img:'u1', title:'Bulleted List'},
	'Unlink'       :{ img:'a4'},
	'l0'           :{ 'text':'enter the url', element:'span' },
	'l1'           :{ 'type':'text',   events:{ 'mousedown':function(){ MooInline.Buttons.self.getRange(); }}, 'id':'miLink', unselectable: 'off' }, 
	'l2'           :{ 'type':'submit', events:{ 'click':    function(){ MooInline.Buttons.self.setRange(); }}, 'value':'add link' },
	'noLink'       :{ 'text':'please select the text to be made into a link'},
	'Save'         :{ img:'', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send(new Hash({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}},
	'Display HTML' :{ click:function(){
						var d = $('displayBox');
						if(d.hasClass('miHide')){
							//d.removeClass('hide'); 
							$('displayBox').set({'styles':curEl.getCoordinates(), 'class':'', 'text':curEl.innerHTML.trim()});
						} else d.addClass('miHide'); 
					}},
	'colorPicker'  :{ 'element':'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
						var lx = mouseLocation.x, ly = mouseLocation.y, Sy=sideSlider.y, b = this.get('width')/7, c=[];
						for(var i=0; i<3; i++){
							var n0=b*i-l,n1=l-b*(i+5);
							if((c[i]=n0<0||n1<0?0:n0<b?n0:n1)>b)c[i]=b; //if(x>b)x=b;x=n0<0||n1<0?0:n0<b?n0:n1;  //c'mon!! Prize for lack of legibility!!!
							x+=((256-x)/256)*Sy;
						}
						c[2]=b-c[2];
					}},
	'Open Siteroller.org Homepage':{'text':'SiteRoller', 'click':function(){ window.open('http://www.siteroller.org') }},
	'body'         :{'id':'miTrigger', 'text':'Edit Page', click:'place'},
	'file'         :{'text':'file'}, 
	'metadata'     :{'text':'metadata'},		
	'Save Changes' :{click:'save', shortcut:'s', 'class':'saveBtn', 'styles':{'width':'75px'} },
	'newBar'       :{click:'toolbar', args:''},
	
	'Main'         :{click:['Bold','Italic','Underline','Strikethrough','subscript','superscript']},
	'File'         :{click:['Paste','Copy','Cut','Redo','Undo']},
	'Link'         :{click:['l0','l1','l2','Unlink'], img:'a4'},
	'Justify'      :{click:['JustifyLeft','JustifyCenter','JustifyRight','JustifyFull']},
	'Lists'        :{click:['InsertOrderedList','InsertUnorderedList']},
	'Indent'       :{click:['Indent','Outdent']}
}
/*
MooInlinex.Buttons = {
	miMain_0: {
		m0:{'text':'SiteRoller', args:'Open Siteroller.org Homepage', 'click':function(){ window.open('http://www.siteroller.org') }},
		m1:{'id':'miTrigger', 'text':'Edit Page', click:'place', args:'body' },
		m2:{'text':'file'}, 
		//m3:{'text':'metadata'},		
		m4:{ title:'Save Changes', 'class':'saveBtn', 'styles':{'width':'75px'}, shortcut:'s', click:'save' }
	},
	
	miTextEdit_1: { 
		//click, args, shortcut, parent, title 
		a0:{ title:'Basic Editing', click:'toolbar', args:'miBasic_2'},
		a4:{ title:'Link', click:'toolbar', args:'miAddLink_2' },
		j2:{ title:'Justify Menu', click:'toolbar', args:'miJustify_2' },
		u0:{ title:'Indent Menu',  click:'toolbar', args:'miIndent_2' },
		i0:{ title:'List Menu',  click:'toolbar', args:'miLists_2' },
		f2:{ title:'Copy, Undo, etc.', click:'toolbar', args:'miFile_2' },
		l0:{ title:'save', click:function(){
						var content = MooInline.Buttons.self.clean();
						(savePath || (savePath = new Request({'url':'http://www.google.com'}))).send(new Hash({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
					}
		},
		f5:{ title:'Display HTML', click:function(){
				var d = $('displayBox');
				if(d.hasClass('miHide')){
					//d.removeClass('hide'); 
					$('displayBox').set({'styles':curEl.getCoordinates(), 'class':'', 'text':curEl.innerHTML.trim()});
				} else d.addClass('miHide'); 
			} 
		}
	},
	
	miBasic_2:{
		a0:{ title:'Bold', shortcut:'b' },
		a1:{ title:'Italic', shortcut:'i' },
		a2:{ title:'Underline', shortcut:'u' },
		a3:{ title:'Strikethrough', shortcut:'s' },
		a5:{ title:'subscript'},
		a6:{ title:'superscript'}
	},
	
	miFile_2:{
		f0:{ title:'Paste', shortcut:'v' },
		f1:{ title:'Copy', shortcut:'c' },
		f2:{ title:'Cut', shortcut:'x' },
		f3:{ title:'Redo', shortcut:'y' },
		f4:{ title:'Undo', shortcut:'z' }
	},
	
	miAddLink_2: {
		l0:{ 'text':'enter the url', element:'a' },
		l1:{ 'type':'text', 'id':'miLink', unselectable: 'off',  events:{ 'mousedown':function(){ MooInline.Buttons.self.getRange(); }}}, 
		l2:{ 'type':'submit', 'value':'add link', events:{'click':function(){ MooInline.Buttons.self.setRange()}} },
		a4:{ title:'Unlink' }
	},
	
	miNoLink_2: {
		n0:{ 'text':'please select the text to be made into a link'}
	},
	
	miJustify_2: {
		j3:{ title:'Justify Left', args:'JustifyLeft'},
		j2:{ title:'Justify Center', args:'JustifyCenter'},
		j1:{ title:'Justify Right', args:'JustifyRight'},
		j0:{ title:'Justify Full', args:'JustifyFull'}
	},
	
	miIndent_2:{
		u0:{title:'Numbered List', args:'InsertOrderedList'},
		u1:{title:'Bulleted List', args:'InsertUnorderedList'}
	},
	
	miLists_2:{
		i0:{title:'Indent'},
		i1:{title:'Outdent'}
	}
}

//debug(row)
//debug(Hash.getKeys(row)[0])
//row = array of buttons, or object.  If array, must be from top?  
//num - the layer down, must be calculated to be one lower thwn active.  Active may need to track the number as well.
//key = $type(row) == 'array' ? 'miTop' : ;
//btns = $splat($type(row))
//Hash.each(MooInline.Buttons[row], function(val, key){//row.  
createToolbar:function(buttons){
	var createToolbar = new Hash(), n=0, t=this;
	buttons.each(function(item, index){
		var items = item.split(',');
		if(!items[1]) createToolbar.extend(MooInline.Buttons.item);
		else {
			createToolbar[n] = {'click':'toolbar', 'img':MooInline.Buttons[items[0]].img};
			//if (items[1]) t.toolbars[n++] = items;
			if (items[1]) MooInline.Buttons[n++] = items;
		}
	})
	MooInline.Buttons['ct'+n] = createToolbar;
	return 'jt0';
},
	


*/
function debug(msg){ if(console)console.log(msg); else alert(msg) }