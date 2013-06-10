MooRTE.Utilities = 
	{ exec: function(){
		var args = Array.from(arguments).flatten();
		document.execCommand(args[0], args[2]||null, args[1]||false);
		}
	, shortcuts: function(e){
		if (e.key=='enter'){
			if (!Browser.ie) return;
			e.stop();
			return MooRTE.Range.insert('<br/>');
		}
		var be, btn, shorts = MooRTE.activeBar.retrieve('shortcuts');	

		if (e && e.control && shorts[e.key]){
			e.stop();
			btn = MooRTE.activeBar.getElement('.rte'+shorts[e.key]);
			btn.fireEvent('mousedown', btn);
		};
	}
	, updateBtns: function(e){
		var val
		  , update = MooRTE.activeBar.retrieve('update');

		update.state.each(function(vals){
			if (vals[2])
				vals[2].call(vals[1], vals[0]);
			else {
				try { val = window.document.queryCommandState(vals[0]) }
				catch(e){ val = false }
				vals[1][(val ? 'add' : 'remove') + 'Class']('rteSelected');
				// Try/Catch works around issue #2.
				// Note1.
			}
		});
		update.value.each(function(vals){
			val = window.document.queryCommandValue(vals[0]);
			if (val) vals[2].call(vals[1], vals[0], val);
		});
		update.custom.each(function(vals){
			vals[2].call(vals[1], vals[0], e);
		});
		if (Browser.firefox && MooRTE.Range.selection.anchorNode.id == 'rteMozFix'){
			MooRTE.Range.selection.extend(MooRTE.Range.selection.anchorNode.parentNode, 0);
			//MooRTE.Range.selection.collapseToStart();
		}
	}
	, addEvents: function(el, events){
		Object.append(el.retrieve('rteEvents',{}), events);
		el.addEvents(events);
	}
	, removeEvents: function(el, destroy){
		Object.each(el.retrieve('rteEvents',{}), function(fn, event){
			el.removeEvent(event, fn);
		});
		if (destroy) el.eliminate('rteEvents');
	}
	, eventHandler: function(onEvent, caller, name){

		// Must check if orig func or string is modified now that $unlink is gone. Should be OK.
		var event = Type.isFunction(onEvent) ? onEvent : ((MooRTE.Elements[name]['events']||{})[onEvent])
		  , provided = {element:name, event:onEvent};

		switch(typeOf(event)){
			case 'function':
				event.call(caller, name, onEvent); break;
			case 'array': 
				// Multiple events. Untested & likely to be deprecated.
				event = Array.clone(event).each(function(e){
					MooRTE.eventHandler(e, caller, name);
				}); break;
			case 'object':
				Object.every(Object.clone(event), function(val,key){
					var vals = Array.from(val).append([name,onEvent]);
					MooRTE.Utilities[key].apply(caller, vals);
				}); break;
			case 'string':
				onEvent == 'source' && onEvent.substr(0,2) != 'on'
					? MooRTE.Range.wrapText(event, caller)
					: MooRTE.Utilities.eventHandler(event, caller, name);
		}
	}
	, addElements: function(elements, place, options){
		//if (!MooRTE.btnVals.args) MooRTE.btnVals.combine(['args','shortcut','element','click','img','load','source','contains']);
		if (!place) place = MooRTE.activeBar.getFirst();
		else if (Type.isArray(place)){
			var relative = place[1]; 
			place = place[0];
		}
		if (!options) options = {};

		if (Type.isString(elements)){
			elements = elements.replace(/'([^']*)'|"([^"]*)"|([^{}:,\][\s]+)/gm, "'$1$2$3'");
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*'[^']+'\s*(?=[\],}]))/gm, "$1{$2}");
			elements = elements.replace(/((?:[,[:]|^)\s*)('[^']+'\s*:\s*{[^{}]+})/gm, "$1{$2}");
			while (elements != (elements = elements.replace(/((?:[,[]|^)\s*)('[^']+'\s*:\s*\[(?:(?=([^\],\[]+))\3|\]}|[,[](?!\s*'[^']+'\s*:\s*\[([^\]]|\]})+\]))*\](?!}))/gm, "$1{$2}")));
			elements = JSON.decode('['+elements+']');
		}

		var els = []
		  , elsLoop = 0;
		do {
			if (els.length) elements = els, els = [];
			Array.from(elements).each(function(item){
				switch(typeOf(item)){
					case 'string': case 'element':
						els.push(item); break;
					case 'object':
						Object.each(item, function(val,key){
							els.push(Object.set(key,val))
						}); break;
					case 'array':
						item.each(function(val){els.push(val)});
						elsLoop = item.length;
				}
			});
		} while (elsLoop);
		
		var collection = []
		, bar = place.hasClass('MooRTE') ? place : place.getParent('.MooRTE');
		
		els.each(function(button){
			if (Type.isObject(button)){
				var btnVals = Object.values(button)[0];
				button = Object.keys(button)[0];
				}
			//console.log('addElements called. elements:',elements,', btn is:',button,', e is:',e,', func args are:',arguments);

			if (Type.isElement(button)) var newEl = button;
			else {
				var btn = button.match(/^([^.#!<>[]+)/i)[0];
				if (!MooRTE.Elements[btn]) var newEl = new Element(button);
				else var loc = {before:'Previous', after:'Next', top:'First'}[relative] || 'Last'
				    , e = place['get' + loc]('.rte' + btn);
				}
			
			if (newEl) var e = newEl.inject(place, relative);
			else if (!e || !options.ifExists){
				var val = MooRTE.Elements[btn]
				  , textarea = (val.tag && val.tag.toLowerCase() == 'textarea')
				  , input = 'text,password,checkbox,file,radio'.contains(val.type)
				  , state = /bold|italic|underline|strikethrough|unlink|(sub|super)script|insert(un)?orderedlist|justify(left|full|right|center)/i.test(btn);

				var properties = Object.append(
					{ title: btn
						.replace(/([0-9]+|[A-Z][a-z]+|[A-Z]+(?=[A-Z][a-z]|[0-9])|^[a-z]+)/g, "$1 ")
						.trim().capitalize() + (val.key ? ' (Ctrl+'+ val.key.toUpperCase()+')' : '')
					, events:{}
					}, Object.clone(val));

				if (!val.tag || val.tag == 'A') val.tag = input ? 'input' : 'a';
				if (val.tag == 'a') properties.href = 'javascript:void(0)';
				if (Browser.ie || Browser.opera) unselectable = input || textarea ? 'off' : 'on';
				if (val.class) button += '.'+val.class;				

				properties.events.mousedown = function(e){
					MooRTE.activeBar = bar;
					var source = bar.retrieve('source')
					  , fields = bar.retrieve('fields');
					
					// Workaround, see docs.
					var holder = MooRTE.Range.parent();
					if (Browser.webkit && holder.nodeType == 3) holder = holder.parentElement;
					
					if (!(fields.contains(MooRTE.activeField) && MooRTE.activeField.contains(holder)))
						(MooRTE.activeField = fields[0]).focus();

					if (e && e.stop) input || textarea ? e.stopPropagation() : e.stop();
					!(val.events||{}).click && !input //&& !source && (!val.tag || val.tag == 'a')
						? MooRTE.Utilities.exec(val.args || btn)
						: MooRTE.Utilities.eventHandler(source || 'click', this, btn);
					}

				MooRTE.Reserved.each(function(bye){
					Type.isString(bye)
						? delete properties[bye]
						: Object.each(bye, function(del,where){
							if (properties[where]) delete properties[where][del]
							});
					});
				
				e = new Element(val.tag + '.rte'+button, properties).store('key',btn).inject(place, relative);

				if ((val.events||{}).update || state)
					bar.retrieve('update', {'value':[], 'state':[], 'custom':[]})[
						/font(name|size)|(back|fore|hilite)color/i
							.test(btn) ? 'value' : (state ? 'state' : 'custom')
					].push([btn, e, (val.events||{}).update]);
				
				if (val.shortcut) bar.retrieve('shortcuts',{})[val.shortcut] = btn;//.set(val.shortcut,btn);
				//if (collection.getCoordinates().top < 0)toolbar.addClass('rteTopDown'); //untested!!
			}

			var sub = btnVals || val && val.contains;
			if (sub && !(options.ifExists == 'stop' && !val))
				MooRTE.Utilities.addElements(sub, e, options.inherit ? options : {});
			e.removeClass('rteHide');
			collection.push(e);

			if (!newEl) MooRTE.Utilities.eventHandler('load', e, btn);
		});
		
		return collection[1] ? collection : collection[0];	
	}
	, tabs: function(tabGroup){ //[, elements][, options], name, event 

		//MooRTE.btnVals.combine(['onExpand','onHide','onShow','onUpdate']);

		var args = Array.from(arguments)
		  , name = args.splice(-2).shift()
		  , options = args[2] || {}
		  , entry = MooRTE.Tabs[tabGroup];

		if (!entry) MooRTE.Tabs[tabGroup] = {};
		else Object.each(entry, function(els, title){
			//[Hide when same, as in when called from custom, to prevent it hiding itself.].
			if (els[0]) if (els[0] == this) return; else els[0].removeClass('rteSelected');
			if (els[1]) els[1].addClass('rteHide');
			if ((options.events||{}).hide) options.events.hide.call(this, name);
			}, this);

		MooRTE.Tabs.active[tabGroup] = name;
		this.addClass('rteSelected').addClass('rteGroupBtn_'+name);
		if (entry = MooRTE.Tabs[tabGroup][name]){
			if (!entry[0]) entry[0] = this;
			return entry[1].removeClass('rteHide');
			}

		if (!args[1]) return; // No group;
		if (Type.isString(options.place)) 
			options.place = this.getParent('.MooRTE').getElement('.rte'+options.place);

		var group = MooRTE.Utilities.addElements(args[1], options.place, {className:'rteGroup_'+name});
		MooRTE.Tabs[tabGroup][name] = [this, group];
		if ((options.events||{}).show) options.events.show.call(this, {content:group});
		}

	, addTab: function(tabGroup, tabName){
		if (!MooRTE.Tabs[tabGroup]) MooRTE.Tabs[tabGroup] = {};
		if (!MooRTE.Tabs[tabGroup][tabName]) MooRTE.Tabs[tabGroup][tabName] = [];
		MooRTE.Tabs[tabGroup][tabName][+(tabName != Array.from(arguments).splice(-2,1))] = this;
		}

	, flyout: function(content, btn, event){
		var opts = 
			{ place: 'Flyouts'
			, events: 
				{ show: function(flyout){
					var pos = this.getParent().getCoordinates(this.getParent('.MooRTE'));
					flyout.content.setStyle('min-width', pos.width - 4)
						.setPosition({x:pos.left - 1, y:pos.height + pos.top });
					}
				}
			};
		MooRTE.Utilities.tabs.call(this, 'flyouts', content, opts, btn, event);
		}
	, popup: function(content, btn, event){
		content= [ 'div.popup:[div.title,div.closeandhelp:[a.help,a.close],div.content:['
   				, ',div.submit:[span.input.insert,span.input.cancel]] ]'].join(content);
   		console.log(1);
		MooRTE.Utilities.tabs.call(this, 'popups', content, {place:'Flyouts'}, btn, event);
		}

	, clipStickyWin: function(caller){
		if (Browser.firefox || (Browser.webkit && caller=='paste')) 
			if (window.AssetLoader) AssetLoader.javascript(['mootools-more.js','StickyWinModalUI.js'], {
				onComplete: function(command){
					var body = "For your protection, "+(Browser.webkit?"Webkit":"Firefox")+" does not allow access to the clipboard.<br/>\
						<b>Please use Ctrl+C to copy, Ctrl+X to cut, and Ctrl+V to paste.</b><br/><br/>\
						If this functionality is important consider switching to Internet Explorer,<br/> which allows us to access [and modify] your system."; 
					MooRTE.Elements.clipPop = new StickyWin.Modal({content: StickyWin.ui('Security Restriction', body, {buttons:[{ text:'close'}]})});	
					MooRTE.Elements.clipPop.hide();
				}
			});
	}
	, fontsize: function(dir, size){
	
		if (size == undefined)
			size = window.document.queryCommandValue('fontsize') 
				|| MooRTE.Range.parent().getStyle('font-size');
		
		//if (size == +size) size = +size + dir;
		if (dir) size = +size + dir;
		else {
			// MooRTE.Utilities.convertunit(size[0],size[1],'px'); Convert em's, xx-small, etc.
			size = size.split(/([^\d]+)/)[0];
			[0,10,13,16,18,24,32,48].every(function(s,i){
				if (s < size) return true;
				size = !(s - size) || dir < 0 ? i + dir : i;
				});
			}

		MooRTE.Utilities.exec('fontsize', size);
		}
	, clean: function(html, options){
	
		options = Object.append({
			xhtml   : false, 
			semantic: true, 
			remove  : ''
		}, options);
		
		var br = '<br'+(xhtml?'/':'')+'>';
		var xhtml = [
			[/(<(?:img|input)[^\/>]*)>/g, '$1 />']									// Greyed out -  make img tags xhtml compatable 	#if (this.options.xhtml)
		];
		var semantic = [
			[/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>'],						// remove divs from <li>		#if (Browser.Engine.trident)
			[/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>'],	 			//
			[/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>'],					//
			[/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>'],									//
			[/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>'],											//
			[/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>'],	//
			[/<p>[\s\n]*(<(?:ul|ol)>.*?<\/(?:ul|ol)>)(.*?)<\/p>/ig, '$1<p>$2</p>'], 				// <p> tags around a list will get moved to after the list.  not working properly in safari? #if (['gecko', 'presto', 'webkit'].contains(Browser.Engine.name))
			[/<\/(ol|ul)>\s*(?!<(?:p|ol|ul|img).*?>)((?:<[^>]*>)?\w.*)$/g, '</$1><p>$2</p>'],		// ''
			[/<br[^>]*><\/p>/g, '</p>'],											// Remove <br>'s that end a paragraph here.
			[/<p>\s*(<img[^>]+>)\s*<\/p>/ig, '$1\n'],				 				// If a <p> only contains <img>, remove the <p> tags	
			[/<p([^>]*)>(.*?)<\/p>(?!\n)/g, '<p$1>$2</p>\n'], 						// Break after paragraphs
			[/<\/(ul|ol|p)>(?!\n)/g, '</$1>\n'],	    							// Break after </p></ol></ul> tags
			[/><li>/g, '>\n\t<li>'],          										// Break and indent <li>
			[/([^\n])<\/(ol|ul)>/g, '$1\n</$2>'],    								// Break before </ol></ul> tags
			[/([^\n])<img/ig, '$1\n<img'],    										// Move images to their own line
			[/^\s*$/g, '']										        			// Delete empty lines in the source code (not working in opera)
		];
		var nonSemantic = [	
			[/\s*<br ?\/?>\s*<\/p>/gi, '</p>']										// if (!this.options.semantics) - Remove padded paragraphs
		];	
		var appleCleanup = [
			[/<br class\="webkit-block-placeholder">/gi, "<br />"],					// Webkit cleanup - add an if(webkit) check
			[/<span class="Apple-style-span">(.*)<\/span>/gi, '$1'],				// Webkit cleanup - should be corrected not to get messed over on nested spans - SG!!!
			[/ class="Apple-style-span"/gi, ''],									// Webkit cleanup
			[/<span style="">/gi, ''],												// Webkit cleanup	
			[/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>'],								// remove stupid apple divs 	#if (Browser.Engine.webkit)
			[/<div>(.+?)<\/div>/ig, '<p>$1</p>']									// remove stupid apple divs 	#if (Browser.Engine.webkit)
		];
		var cleanup = [
			[/<br\s*\/?>/gi, br],													// Fix BRs, make it easier for next BR steps.
			[/><br\/?>/g, '>'],														// Remove (arguably) useless BRs
			[/^<br\/?>/g, ''],														// Remove leading BRs - perhaps combine with removing useless brs.
			[/<br\/?>$/g, ''],														// Remove trailing BRs
			[/<br\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs from end of blocks
			[/<p>\s*<br\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// Remove padded paragraphs - replace with non breaking space
			[/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>'],							// ''
			[/<p>\W*<\/p>/g, ''],													// Remove ps with other stuff, may mess up some formatting.
			[/<\/p>\s*<\/p>/g, '</p>'],												// Remove empty <p> tags
			[/<[^> ]*/g, function(match){return match.toLowerCase();}],				// Replace uppercase element names with lowercase
			[/<[^>]*>/g, function(match){											// Replace uppercase attribute names with lowercase
			   match = match.replace(/ [^=]+=/g, function(match2){return match2.toLowerCase();});
			   return match;
			}],
			[/<[^>]*>/g, function(match){											// Put quotes around unquoted attributes
			   match = match.replace(/( [^=]+=)([^"][^ >]*)/g, "$1\"$2\"");
			   return match;
			}]
		];
		var depracated = [
			// The same except for BRs have had optional space removed
			[/<p>\s*<br ?\/?>\s*<\/p>/gi, '<p>\u00a0</p>'],							// modified as <br> is handled previously
			[/<br>/gi, "<br />"],													// Replace improper BRs if (this.options.xhtml) Handled at very beginning			
			[/<br ?\/?>$/gi, ''],													// Remove leading and trailing BRs
			[/^<br ?\/?>/gi, ''],													// Remove trailing BRs
			[/><br ?\/?>/gi,'>'],													// Remove useless BRs
			[/<br ?\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1'],					// Remove BRs right before the end of blocks
			//Handled with DOM:
			[/<p>(?:\s*)<p>/g, '<p>']												// Remove empty <p> tags
		];
		
		var washer;
		if (typeOf(html)=='element'){
			washer = html;
			var bar = washer.retrieve('bar');
			if (washer.contains(bar) && washer != bar) washer.moorte('remove');
			//if(washer.hasChild(washer.retrieve('bar'))) washer.moorte('remove');
		} else washer = $('washer') || new Element('div',{id:'washer'}).inject(document.body);

		washer.getElements('p:empty'+(options.remove ? ','+options.remove : '')).destroy();
		if (!Browser.firefox) washer.getElements('p>p:only-child').each(function(el){ var p = el.getParent(); if(p.childNodes.length == 1) el.replaces(p)  });  // The following will not apply in Firefox, as it redraws the p's to surround the inner one with empty outer ones.  It should be tested for in other browsers. 
		html = washer.get('html');
		if (washer != $('washer')) washer.moorte();
		
		if (xhtml) cleanup.append(xhtml);
		if (semantic) cleanup.append(semantic);
		if (Browser.webkit) cleanup.append(appleCleanup);

		// var loopStop = 0;  //while testing.
		do {
			var cleaned = html;
			cleanup.each(function(reg){ html = html.replace(reg[0], reg[1]); });		
		} while (cleaned != html); // && ++loopStop <3
		
		return html.trim();
	}
};

if (false) Object.extend(MooRTE.Utilities, 
	{	update: function(group){
	 		Object.each(MooRTE.tabs[group], function(els){
	 			els[0].removeClass('rteSelected');
	 			});
	 		pos = styles.getStyle('background-position');
			head.setStyle('background-position', pos);
			}
	});
