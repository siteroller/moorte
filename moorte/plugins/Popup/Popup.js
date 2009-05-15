var Popup = new Class({
		
	Implements: [Options],

	options:{
		modal: true,
		clickHide: false,
		location: 'center center', 	
		id: '',
		footer:'',
		update:false
	},
	
	initialize: function(id,content,title,options){
		function $El(tag,props){ return new Element(tag,props); };
		
		var self = this.setOptions(options), pop;
		if(!$('pop')){				
			pop = $El('div',{id:'pop'}).inject(document.body).adopt(
				new IFrame({id:'popModal'}),
				$El('form', {id:'popPrototype','class':'popup popHide'}).adopt(
					$El('div',{'class':'popHead'}).adopt(
						$El('h3',{'class':'popTitle'}), 
						$El('div',{'class':'popClose','text':'X'}) 
					),
					$El('div',{'class':'popMid'}).adopt(
						$El('div',{'class':'popContent'})
					),
					$El('div',{'class':'popFooter'})
				)
			);
			
			var modal = $('popModal').contentWindow.document;
			modal.open();
			modal.write('<html><body>&nbsp;</body></html>');
			modal.close();	
		} 
		this.show();
		if(!(popup = $(id))){
			popup = $('popPrototype').clone().set('id',id).inject('pop');
			popup.getElement('.popClose').addEvent('click',self.hide);
			popup.getElement('.popTitle').set('html',title);
			popup.getElement('.popContent').set('html',content);
			popup.getElement('.popFooter').set('html',self.footer);
		}
		popup.removeClass('popHide');
		var d = popup.getSize();
		return popup.setStyle('margin', d.y/-2+' '+d.x/-2);	
		
		/*var format = self.location.split(/\s+/);
		while(++i<2){
			var num = ['top','center','bottom'].indexOf(format[0]);
			if(num > -1){
				margin.push(d[i]/-num);
				background-position:
		}
		switch(format[1]){
			case 'center' : ['50%', -2]; break;
			case 'bottom': ['100%', -1]; break;
			case 'top': [0,0]
		[0,d.y,d.y/2]
		var y = 'center,bottom,top'.contains(format[1]).contains('px') ? 
		*/
	},
	
	hide:function(){
		$('pop').addClass('popHide');
	},
	
	show: function(){
	console.log('show')
		$('pop').removeClass('popHide');
	}

})