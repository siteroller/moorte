MooRTE.extensions = function(){
	
	var params = Array.link(arguments, {'options': Type.isObject, 'cmd': Type.isString, 'rte':Type.isElement})
	  , cmd = 'detach,hide,remove,destroy'.test(params.cmd,'i') ? params.cmd.toLowerCase() : ''
	  , editables = Array.from(this);
	
	editables.every(function(self, i){

		var bar
		  , els
		  , self = editables[i] = self.retrieve('new') || self;

		if (params.rte){
			bar = params.rte.hasClass('MooRTE') ? params.rte : params.rte.retrieve('bar');
			if (!bar) return alert('Err 600: The passed in element is not connected to an RTE.'), 600;
			if (self.retrieve('bar') != bar){
				self.retrieve('bar').retrieve('fields').erase(self);
				self.store('bar', bar);
				bar.retrieve('fields').include(self);
			}
		} else bar = self.hasClass('MooRTE') ? self : self.retrieve('bar');

		if (!cmd){
			if (!bar){ 
				new MooRTE(Object.merge(params.options || {}, {'elements':this}));
				editables[i] = self.retrieve('new') || self;
				return false;
			} else if (bar.hasClass('rteHide')) return bar.removeClass('rteHide');
		} else if (!bar || self.retrieve('removed') || !self.getParent()) return true;
		
		switch (cmd){
			case 'hide':
				return bar.addClass('rteHide');
			case 'detach':
				if (self == bar) return true;
				bar.retrieve('fields').erase(self); 
				els = [self];
				break;
			case 'remove':
				// Don't store 'removed' if already stored. Alternatively could check if element is in DOM by if (!bar.getParent()). 
				// ToDo: Added as a hotfix, but why is this check neccessary?
				if (bar.retrieve('removed')) return true;
				bar.store('removed', bar.getPrevious()
						? [bar.getPrevious(),'after']
						: [bar.getParent(),'top']);
				bar.dispose();
				els = bar.retrieve('fields');
				break;			
			case 'destroy':
				els = bar.retrieve('fields');
				bar = bar.destroy();
				break;
			default:
				els = [self]
				  , removed = bar.retrieve('removed');
				if (removed){
					els = bar.retrieve('fields');
					bar.inject(removed[0], removed[1]).eliminate('removed');
				} else if (self == bar) return;
				
				els.each(function(el){
					bar.retrieve('fields').include(el);
					var src = el.retrieve('src');
					if (!src){
						el.set('contentEditable', true);
						MooRTE.Utilities.addEvents(el, el.retrieve('rteEvents'));
						// if (Browser.firefox && !el.getElement('#rteMozFix')) 
						//	el.grab(new Element('div', {id:'rteMozFix', styles:{display:'none'}}));
					} else if (src.getParent()) el.set('html', src.get('value')).replaces(src);
				})
				return true;
		}
				
		editables[i] = self.retrieve('src') || self;
		els.each(function(el){
			if (Browser.firefox && el.getElement('#rteMozFix')) el.getElement('#rteMozFix').destroy();
			var src = el.retrieve('src');
			if (src){
				src.set('value', el.get('html')).replaces(el);
				if (!bar){
					src.eliminate('new');
					el.destroy();
				}
			} else {
				el.set('contentEditable', false);
				MooRTE.Utilities.removeEvents(el, 'destroy');
				if (!bar) el.eliminate('bar');
			}
		});
		return true;
	}.bind(this));
	
	return editables;
}

Element.implement({moorte:MooRTE.extensions});
Elements.implement({moorte:MooRTE.extensions});
