MooRTE.Word10 = // Word 10 Elements
	{ stylesCollection:
		{ tag:'div'
		, contains:'[div.f_normal.rteSelected:div,div.f_noSpacing:div,div.f_h1:div,div.f_h2:div,div.f_h3:div]'
		}
	, arrow:		
		{ events:
			{ load: function(){
				var prev = this.getPrevious();
				var which = prev.get('tag') == 'input' ? 2 : +(prev.getSize().y > 25);
				//var which = +(prev.getSize().y < 25) + +(prev.get('tag') == 'input');
				new Element('span.arrowCase.arrow' + which).wraps(prev).grab(this);
				}
			, click: function(){
				var prev = this.getPrevious().retrieve('key');
				MooRTE.Utilities.flyout.call(this, prev+'Flyout', prev, 'click');
				}
			}
		}

	// Tabs
	, FileTab:
   	{ text:'File', events:
   		{click:{tabs: ['RibbonTabs', 'FileRibbon', MooRTE.Groups.RibbonOpts]} }
   	}
	, HomeTab:	
		{ text:'Home', 'class':'rteSelected', events:
			{ load: {addTab:['RibbonTabs']}
			, click:{tabs: ['RibbonTabs', 'HomeRibbon', MooRTE.Groups.RibbonOpts]}
   		}
   	}
   , InsertTab:
		{ text:'Insert', events:{
			click:{tabs: ['RibbonTabs', 'InsertRibbon', MooRTE.Groups.RibbonOpts]}} 
		}
	
	// Ribbons
	, TopBar: {tag:'div', contains:'save,undo,redo'} 
   , FileRibbon: 
		{ tag:'div', contains:
			'div.rteFileGroup:[div:[insertHorizontalRule]]' 
		}
	, HomeRibbon:
   	{ tag:'div'
   	, events:{ load:{addTab:['RibbonTabs', 'HomeTab']} }
   	, contains: 
			'div.rteClipGroup:[div:[paste32,arrow,span.stacked:[cut,copy,formatPainter]]]\
			,div.rteFontGroup:[div:[fontFamily,arrow,fontSize,arrow,increaseFontSize,decreaseFontSize\
				,span.rtedivider,changeCase,span.rtedivider,removeFormat,bold,italic,underline,arrow,strikethrough\
				,subscript,superscript,span.rtedivider,style,arrow,hilight,arrow,fontColor,arrow]]\
			,div.rteParaGroup:[div:[insertUnorderedList,arrow,insertOrderedList,arrow,multiLevelList\
				,span.rtedivider,indent,outdent,span.rtedivider,sort,span.rtedivider,invisibleChars,justifyLeft,justifyCenter\
				,justifyRight,justifyFull,span.rtedivider,paragraphSpacing,span.rtedivider,fill,arrow,borderBottom,arrow]]\
			,div.rteStylGroup:[div:[div.stylesCollection:[div.f_normal.rteSelected:div,div.f_noSpacing:div,div.f_h1:div,div.f_h2:div,div.f_h3:div],changeStyles,arrow]]\
			,div.rteEditGroup:[div.stacked:[find,replace,selection]]'
		}
	, InsertRibbon:
		{ tag:'div.bigIcons', contains:
			'div.rtePageGroup:[div:[coverPage,arrow,blankPage,pageBreak]]\
			,div.rteTablGroup:[div:table]\
			,div.rteIlluGroup:[div:[picture,clipArt,shapes,smartArt,chart,screenshot]]\
			,div.rteLinkGroup:[div:[hyperlink,bookmark,"cross-reference"]]\
			,div.rteHeadGroup:[div:[header,footer,pageNumber]]\
			,div.rteTextGroup:[div:[textBox,quickParts,wordArt,dropCap,span.stacked.smallIcons:[signatureLine,dateTime,object]]]\
			,div.rteSymbGroup:[div:[equation,arrow,symbol]]'
		}
	// Flyout Triggers
	, symbol:{ events:{ click:{flyout:['symbolFlyout']} }}
	, changeCase:
		{ 'class':'wideIcon'
		, events:
			{ click : {flyout:['div.caseFlyouts:[sentencecase,lowercase,uppercase,wordCase,togglecase]']}
			, update: function(el, event){
				var active, flyouts = MooRTE.Tabs.flyouts;
				if  (  !flyouts 
					|| !(active = flyouts[MooRTE.Tabs.active.flyouts])
					|| MooRTE.Tabs.active.flyouts == event.target.retrieve('key')
					 ) return;
				
				active[0].removeClass('rteSelected');
				active[1].addClass('rteHide');
				MooRTE.Tabs.active.flyouts = '';
				}
			}
		}

	// Flyouts
	, underlineFlyout:  { tag:'div' }
	, bulletsFlyout:    { contains: 'insertorderedlist,insertunorderedlist'}  
	, listFlyout:       { contains: 'insertorderedlist,insertunorderedlist'}
	, fontFamilyFlyout: { tag:'div', contains: 'div.f_calibri,div.f_tahoma,div.f_comic'}
	, fontSizeFlyout:
		{ tag: 'div'
		, events:
			{ load: function(){
				this.addEvent('click:relay(div)',function(){
					MooRTE.Utilities.fontsize(0, this.get('text'));
					});
				[8,9,10,11,12,14,16,18,20,22,24,26,28,36,48,72]
					.each(function(num){ this.grab(new Element('div',{text:num})); },this);
				}
			, update: function(el, event){
				var active, flyouts = MooRTE.Tabs.flyouts;
				if  (  !flyouts 
					|| !(active = flyouts[MooRTE.Tabs.active.flyouts])
					|| MooRTE.Tabs.active.flyouts == event.target.retrieve('key')
					 ) return;
				
				active[0].removeClass('rteSelected');
				active[1].addClass('rteHide');
				MooRTE.Tabs.active.flyouts = '';
				}
			}
		}
   , changeCaseFlyout: { contains: 'sentencecase,lowercase,uppercase,wordCase,togglecase'}
   , symbolFlyout:
   	{ tag: 'div', contains: function(){
			var chars = [174,169,165,163,8364,8805,8804,8800,177,8482,945,181,8734,215,247,9217,931,937,8719,946]
			  , div = new Element('div').addEvent('mousedown:relay(a)', function(){ 
			  			MooRTE.Range.insert(this.get('text')) 
			  			})
			  , p = new Element('p').addEvent('mousedown',function(){ 
						MooRTE.Utilities.popup.call(this,'symbolChart','symbolPopup','click') 
						});

			chars.forEach(function(char){ new Element('a',{href:'#',html:'&#'+char+';'}).inject(div); }); 
			return [div,p];
			}()
   	}

   , symbolChart:
		{ tag:'div',contains: [new Element('input#charCode',{type:'text'}),
			function(){
			//<a>'+n+'</a>
			for (var htm = '', n = 0; n < 10000; n++) htm += '<span>&#'+n+';</span>';
			return new Element('div',{html:htm}).addEvent('mousedown:relay(span)',function(){
				MooRTE.Range.insert(this.get('text'))
				});
			}()
			]
   	}
   , equations:
		[ 'ax^2 + bx + c = 0'
		, 'x = {-b \\pm \\sqrt{b^2-4ac} \\over 2a}'
		, '\\textstyle \\sqrt{x+2}\\quad \\underline 4\\quad \\overline{x+y}\\quad x^{\\underline n}\\quad x^{\\overline{m+n}} \\quad \\sqrt{x^2+\\sqrt{\alpha}}'
		, '\\cos x\\,+\\,\\cos y\\,=\\,2 \\cos \\frac{x\\,+\\,y}{2} \\cos \\frac{x\\,-\\,y}{2}'
		, '\\textstyle 10^{10}\\quad 2^{n+1}\\quad (n+1)^2\\quad \\sqrt{1-x^2}\\quad \\overline{w+\\bar z} \\quad p^{e_1}_1\\quad a_{b_{c_{d_e}}}\\quad \\root 3 \\of {h_n(\\alpha x)}'
		, '(1+x)^n=1+nx/1!+(n(n-1) x^2)/2!+?'
		, 'x^2 + y^2 = r^2'
		, 'A = \\pi r^2 \\sin x\\,\\pm\\,\\sin y\\,=\\,2 \\sin \\frac{x\\,\\pm\\,y}{2} \\cos \\frac{x\\,\\mp\\,y}{2}'
		, '(x+y)^n = \\sum_{r=0}^{n} {{n}\\choose{r}}y^r x^{n-r}'
		, '\\psi(x)=\\sum_i C_i \\phi_i(x)'
		]

   // Popups
   , paste32Popup:{contains:'div.pasteMsg'}
	}
Object.merge(MooRTE.Elements,MooRTE.Word10);