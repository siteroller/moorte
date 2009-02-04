var MooInline = new Class({
	
	Implements: [Events, Options],

	options:{
		xhtml   : true,
		auto    : true,
		inline  : false,
		floating: true,
		location: 'multiple', 		// 'single', 'pageTop', 'pageBottom'
		toolbar : 'miTextEdit_1', 	//'miMain_0' if auto is false
		imgPath : 'mooinline/images/',
		savePath: '/siteroller/classes/editor/update.php'
	},
	
	initialize: function(els, options){
		this.setOptions(options);
		MooInline.Buttons.self = this;
		this.savePath = new Request({'url':this.options.savePath});
		this.options.auto ? this.activate(els) : this.toolbar(this.options.toolbar);
	},

	activate: function(selectors, toolbars){
		
		var els = $$(selectors||'textarea, .mooinline'), i=this.options.inline, l=this.options.location.substr(4,1).toLowerCase(), t=this, mta;
		
		function insertToolbar(){
			var mta = new Element('div', {'class':'miRemove miMooInline '+(i?'miHide':''), 'contentEditable':false }).adopt(
				 new Element('div', {'class':'miWysEditor' }),
				 new Element('textarea', {'class':'miWygEditor miHide', 'type':'text' })
			).inject(document.body);	
			t.toolbar(t.options.toolbar, 0, mta.getElement('.miWysEditor'));
			return mta;
		}
		function positionToolbar(el, mta){
			var p = el.getCoordinates();
			mta.setStyles({display:'block', width:p.width}); 
			var top = p.top - mta.getCoordinates().height; 
			mta.setStyles({ 'left':p.left, 'top':(top > 0 ? top : p.bottom) });
			el.set('contentEditable', true);
		}
		function insertEl(el){
			var div = new Element('div', {'class':'mtaTextArea '+el.get('class'), 'id':'jay', 'styles':el.getCoordinates(), text:el.get('value') }).inject(el, 'before');//el.get('styles'), 'styles':.extend() 
			el.addClass('miHide');
			return div;
		}
		
		els.each(function(el, index){
			if(el.get('tag') == 'textarea' || el.get('tag') == 'input') el = insertEl(el);
			if(l=='i' || !mta) mta = insertToolbar(); 
			if(!i) positionToolbar(el, mta); else el.addEvents({
				'click': function(){ positionToolbar(el, mta) }
			});
		})
	},
	
	toolbar: function(row, num, toolbar){
		var t = this, num = row.slice(-1), an = 'active'+num, bar, top=''; 
		toolbar ? top =' miTop' : toolbar = t.active;
	
		var parent = toolbar.getElement('.miR'+num) || new Element('div',{'class':'miR'+num+top}).inject($(toolbar));
		if(!(bar = parent.getElement('.'+row))){ 
			bar = new Element('div', {'class':row}).inject(parent);
			MooInline.Buttons[row].each(function(val, key){
				var properties = new Hash({
					styles:{'background-image':'url('+t.options.imgPath+key.substr(0,1)+'.gif)', 'background-position':(16+16*key.substr(1))+'px 0' }, //-16
					title: val.args,
					unselectable: 'on',
					events:{
						'mousedown': function(e){ 
							e.stop(); 
							t.active = this.getParent('.miWysEditor')
							val.click ? ($type(val.click)=='string' ? t[val.click] : val.click).attempt(val.args||val.title,t) : t.exec(val.args||val.title)
						}
					}
				}).extend(val).erase('args').erase('shortcut').erase('element').erase('click').getClean();
				var btn = new Element(('submit,text,password'.contains(val.type) ? 'input' : val.element||'span'), properties).inject(bar);
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
			//[/<p>\s*<p>/g, '<p>'],									// ! Remove double <p> tags - very dangerous, see next line 
			//[/<\/p>\s*<\/p>/g, '</p>'],								// ! Remove double ending <p>s. - it will mess up the following: <p>a<p>b</p></p> --consider switching to a system of using node trees.
			[/<p>\W*<\/p>/g, ''],										// Remove ps with other stuff, may mess up some formatting.
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	// Semantic conversion.  Should be separate array that is merged in if semantic is set to true.
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>']
		];
		cleanup.each(function(val, key){ console.log(val); source = source.replace(val[0], val[1]); });
		return source;
	},

	save: function(){
		var content = this.clean(document.body.innerHTML);
		this.savePath.send( new Hash({ 'page': window.location.pathname, 'content': content }).toQueryString() );	
	}
})

MooInline.Buttons = {
	miMain_0: new Hash({
		m0:{'text':'SiteRoller', args:'Open Siteroller.org Homepage', 'click':function(){ window.open('http://www.siteroller.org') }},
		m1:{'id':'miTrigger', 'text':'Edit Page', click:'place', args:'body' },
		m2:{'text':'file'}, 
		//m3:{'text':'metadata'},		
		m4:{ title:'Save Changes', 'class':'saveBtn', 'styles':{'width':'75px'}, shortcut:'s', click:'save' }
	}),
	
	miTextEdit_1: new Hash({ 
		//click, args, shortcut, parent, title 
		a0:{ title:'Bold', shortcut:'b' },
		a1:{ title:'Italic', shortcut:'i' },
		a2:{ title:'Underline', shortcut:'u' },
		a3:{ title:'Strikethrough', shortcut:'s' },
		a4:{ title:'Link', click:'toolbar', args:'miAddLink_2' },
		a5:{ title:'Unlink' },
		j2:{ title:'Justify Menu', click:'toolbar', args:'miJustify_2' },
		u0:{ title:'Indent Menu',  click:'toolbar', args:'miIndent_2' },
		i0:{ title:'List Menu',  click:'toolbar', args:'miLists_2' },
		
		f0:{ title:'Paste', shortcut:'v' },
		f1:{ title:'Copy', shortcut:'c' },
		f2:{ title:'Cut', shortcut:'x' },
		f3:{ title:'Redo', shortcut:'y' },
		f4:{ title:'Undo', shortcut:'z' },
		f5:{ title:'Display HTML', click:function(){
				var d = $('displayBox');
				if(d.hasClass('miHide')){
					//d.removeClass('hide'); 
					$('displayBox').set({'styles':curEl.getCoordinates(), 'class':'', 'text':curEl.innerHTML.trim()});
				} else d.addClass('miHide'); } 
		}
	}),
	
	miAddLink_2: new Hash({
		l0:{ 'text':'enter the url' },
		l1:{ 'type':'text', 'id':'miLink', unselectable: 'off',  events:{ 'mousedown':function(){ MooInline.Buttons.self.getRange(); }}}, 
		l2:{ 'type':'submit', 'value':'add link', events:{'click':function(){ MooInline.Buttons.self.setRange()}}}
	}),
	
	miNoLink_2: new Hash({
		n0:{ 'text':'please select the text to be made into a link'}
	}),
	
	miJustify_2: new Hash({
		j3:{ title:'Justify Left', args:'JustifyLeft'},
		j2:{ title:'Justify Center', args:'JustifyCenter'},
		j1:{ title:'Justify Right', args:'JustifyRight'},
		j0:{ title:'Justify Full', args:'JustifyFull'}
	}),
	
	miIndent_2:new Hash({
		u0:{title:'Numbered List', args:'InsertOrderedList'},
		u1:{title:'Bulleted List', args:'InsertUnorderedList'}
	}),
	
	miLists_2:new Hash({
		i0:{title:'Indent'},
		i1:{title:'Outdent'}
	})
}

//function debug(msg){ if(console)console.log(msg); else alert(msg) }