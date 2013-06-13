MooRTE.BasicElements = 
	{ cut:
	{ title:'Cut (Ctrl+X)', events:
			{ load:MooRTE.Utilities.clipStickyWin
			, click:function(action){ Browser.firefox ? MooRTE.Elements.clipPop.show() : MooRTE.Utilities.exec(action); }
			}
		}
   , copy:
   	{ title:'Copy (Ctrl+C)', events:
			{ load:MooRTE.Utilities.clipStickyWin
			, click: function(action){ 
				Browser.firefox 
					? MooRTE.Elements.clipPop.show() 
					: MooRTE.Utilities.exec(action); 
				}
			}
		}
   , paste:
   	{ title:'Paste (Ctrl+V)', events:
			{ load: MooRTE.Utilities.clipStickyWin //load:function() { MooRTE.Utilities.clipStickyWin(1) },
			, click: function(action){ 
				Browser.firefox || Browser.webkit 
					? MooRTE.Elements.clipPop.show() 
					: MooRTE.Utilities.exec(action); 
					}
			}
		}
	, paste32:
		{ 'class':'bigIcon', title:'Paste (Ctrl+V)', events:
			{ click:function(){
				var content = '';
				MooRTE.Utilities.flyout(content,'paste32','click',1)} 
			}
		}
   , save:
   	{ src:'http://siteroller.net/test/save.php', events:
			{ click:function(){
				var content = { 'page': window.location.pathname }
				  , next = 0; 
				content.content = []; 
				this.getParent('.MooRTE').retrieve('fields').each(function(el){
					content['content'][next++] = MooRTE.Utilities.clean(el);
					});

				new Request(
					{ url: MooRTE.Elements.save.src
					, onComplete:function(response){alert("Your submission has been received:\n\n"+response);}
					}).send(Object.toQueryString(content));
				}
			}
		}
   , 'Html/Text':
   	{ click:['DisplayHTML'] }
   , DisplayHTML:
		{ tag: 'textarea', unselectable:'off', 'class': 'displayHtml'
		, init:function(){
				var el= this.getParent('.MooRTE').retrieve('fields')
				  , p = el.getParent()
				  , size = (p.hasClass('rteTextArea') ? p : el).getSize(); 
				this.set({'styles':{width:size.x, height:size.y}, 'text':el.innerHTML.trim()})
			}
		}
   , colorpicker	:{ tag:'img', 'src':'images/colorPicker.jpg', 'class':'colorPicker', click:function(){
							//c[i] = ((hue - brightness) * saturation + brightness) * 255;  hue=angle of ColorWheel.  saturation =percent of radius, brightness = scrollWheel.
							//for(i=0;i<3;i++) c[i] = ((((h=Math.abs(++hue)) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
							//c[1] = -(c[2] - 255*saturation);var hex = c.rgbToHex();
							//var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 - 2, saturation = Math.sqrt(x*x+y*y) / radius;
							var c, radius = this.getSize().x/2, x = mouse.x - radius, y = mouse.y - radius, brightness = hue.y / hue.getSize().y, hue = Math.atan2(x,y)/Math.PI * 3 + 1, saturation = Math.sqrt(x*x+y*y) / radius;
							for(var i=0;i<3;i++) c[i] = (((Math.abs((hue+=2)%6 - 3) < 1 ? 1 : h > 2 ? 0 : -(h-2)) - brightness) * saturation + brightness) * 255;  
							var hex = [c[0],c[2],c[1]].rgbToHex();
						 }}
   , hyperlink		:{ title:'Create hyperlink'
					   , click:function(){
								MooRTE.Range.create();
								$('popTXT').set('value',MooRTE.Range.get('text', MooRTE.ranges.a1));
								MooRTE.Elements.linkPop.show();
						}
					   , load: function(){
							if (window.Asset) new Asset.javascript('StickyWinModalUI.js', {
								self: this
								//, path: 'CMS/library/thirdparty/MooRTE/Source/Assets/scripts/'
								, onComplete: function(){
									var body = "<span style='display:inline-block; width:100px'>Text of Link:</span><input id='popTXT'/><br/>\
												<span style='display:inline-block; width:100px'>Link To Location:</span><input id='popURL'/><br/>\
												<input type='radio' name='pURL'  value='web' checked/>Web<input type='radio' name='pURL' id='pURL1' value='email'/>Email"
									  , buttons = 
										[ { text:'cancel' }
										, { text:'OK'
										  , click: function(){
												// if(me.getParent('.MooRTE').hasClass('rteHide'))MooRTE.ranges.a1.commonAncestorContainer.set('contenteditable',true);
												MooRTE.Range.set();
												var value = $('popURL').get('value');
												if ($('pURL1').get('checked')) value = 'mailto:' + value;
												MooRTE.Utilities.exec(value ? 'createlink' : 'unlink', value); 
												} 
										  }
										];
									MooRTE.Elements.linkPop = new StickyWin.Modal({content: StickyWin.ui('Edit Link', body, {buttons:buttons})});	
									MooRTE.Elements.linkPop.hide();
								}
							})
						}}  // Ah, but its a shame this ain't LISP ;) ))))))))))!
   , moouploads:		{ events: { load: function(){
						new Asset.javascript(AssetLoader.path + 'mooupload/Source/mooupload.js', {
							onComplete: function(){
								var uploader = new MooUpload( this,
									{ action: AssetLoader.path + 'mooupload/Demo/upload.php'	// Path to upload script
									, flash: { movie: AssetLoader.path + 'mooupload/Source/Moo.Uploader.swf' }
									, autostart: true
									, accept: 'image/*'
									, onButtonDown :function(){ MooRTE.Range.set() }
									, onButtonEnter :function(){ MooRTE.Range.create() }
									, onFileUpload: function(args, data){
										var path = AssetLoader.path + 'mooupload/Demo/tmp/' + data.upload_name;
										MooRTE.Range.set();
										MooRTE.Utilities.exec('insertimage',path)
										}
									})
								}
							})
					  		}
						}
					}
   , blockquote	:{ click:function(){	MooRTE.Range.wrap('blockquote'); } }
   , start			:{ tag:'span' }
   , viewSource	:{ click:'source', source:function(btn){
						var bar = MooRTE.activeBar, el = bar.retrieve('fields')[0], ta = bar.getElement('textarea.rtesource');
						if(this.hasClass('rteSelected')){
							bar.eliminate('source');
							this.removeClass('rteSelected');
							if (el.contains(el.retrieve('bar'))) el.moorte('remove'); //was hasChild
							el.set('html',ta.addClass('rteHide').get('value')).moorte();
						} else {
							bar.store('source','source');
							if(ta){
								this.addClass('rteSelected');
								ta.removeClass('rteHide').set('text',MooRTE.Utilities.clean(bar.retrieve('fields')[0]));
							} else MooRTE.Utilities.group.apply(this, ['source', btn]);
						}
					}}
   , source			:{ tag:'textarea', 'class':'displayHtml', unselectable:'off', load:function(){ 
						var bar = this.getParent('.MooRTE'), el = bar.retrieve('fields')[0], size = el.getSize(), barY = bar.getSize().y;
						this.set({'styles':{ width:size.x, height: size.y - barY, top:barY }, 'text':MooRTE.Utilities.clean(el) });
					}}
   , cleanWord		:{	click: function() {
						var s = this.replace(/\r/g, '\n').replace(/\n/g, ' ');
						var rs = [
							/<!--.+?-->/g,			// Comments
							/<title>.+?<\/title>/g,	// Title
							/<(meta|link|.?o:|.?style|.?div|.?head|.?html|body|.?body|.?span|!\[)[^>]*?>/g, // Unnecessary tags
							/ v:.*?=".*?"/g,		// Weird nonsense attributes
							/ style=".*?"/g,		// Styles
							/ class=".*?"/g,		// Classes
							/(&nbsp;){2,}/g,		// Redundant &nbsp;s
							/<p>(\s|&nbsp;)*?<\/p>/g// Empty paragraphs
						]; 
						rs.each(function(regex) {
							s = s.replace(regex, '');
						});
						return s.replace(/\s+/g, ' ');
					} }

   , decreaseFontSize:
		{ events:
			{ click: function(){ if (!Browser.firefox) return MooRTE.Utilities.fontsize.pass(-1) }() }
			/* Fontsize was originally only supposed to accept valuies between 1 - 7.
				It was afterwards changed to accept a much, much greater range of values, but not a single browser has a correct implementation.
					http://msdn.microsoft.com/en-us/library/ms530759(VS.85).aspx
					http://msdn.microsoft.com/en-us/library/aa219652(office.11).aspx
					(Linked to by http://msdn.microsoft.com/en-us/library/aa220275(office.11).aspx)
				
				Table of values:
			
				Webkit is particularly bad:
					#12874 [WontFix]: execCommand FontSize -webkit-xxx-large instead of passed px value - https://bugs.webkit.org/show_bug.cgi?id=12874
						Now this gives me (no matter what I pass): <span class="Apple-style-span" style="font-size: -webkit-xxx-large;">Text</span>		
					#21679 [New]: execCommand FontSize does not change size of background color - https://bugs.webkit.org/show_bug.cgi?id=21679
						Double the text height, the previous background color will only cover the bottom half of the new text.
					#21033 [Resolved]: QueryCommandValue('FontSize') returns bogus pixel values - https://bugs.webkit.org/show_bug.cgi?id=21033
						The actual text is much smaller than the px values Safari gives. WK should return 1-7, as in IE and FF.
					The actual ridiculous results of the command:
						https://bug-21033-attachments.webkit.org/attachment.cgi?id=66960
						Test: http://gitorious.org/webkit/webkit/blobs/860c3cf250187b1679ce9701fe5892a482d319e6/LayoutTests/editing/execCommand/query-font-size.html
						Results: http://gitorious.org/webkit/webkit/blobs/860c3cf250187b1679ce9701fe5892a482d319e6/LayoutTests/editing/execCommand/query-font-size-expected.txt
						
						Possible values "reference a table of font sizes computed by the user-agent". Possible values are:
						http://www.w3schools.com/CSS/pr_font_font-size.asp
						http://style.cleverchimp.com/font_size_intervals/altintervals.html
			*///MooRTE.Range.parent().parentElement.parentElement.getElements('span[style^="font-size:"]').setStyle('font-size',+fontsize[0] - 1 + fontsize[1]);
		}
   , increaseFontSize:
   	{ event:
			{ click: function(){ if (!Browser.firefox) return MooRTE.Utilities.fontsize.pass(1) }() }
		}

	, sentencecase:{ tag:'p', text:'Sentence case'} 
	, lowercase:	{ tag:'p', text:'lowercase'}
	, uppercase:	{ tag:'p', text:'UPPERCASE'}
	, wordCase: 	
		{ tag:'p', text:'Word Case', events:
			{ click:function(){
				console.log(window.getSelection(), window.getSelection().toString());
				MooRTE.Range.replace(MooRTE.Range.get('text').capitalize()); MooRTE.Range.set()
				}
			}
		} 
	, togglecase:	{ tag:'p', text:'tOGGLE cASE'}

 	, backColor:
 		{ events:
	 		{ load:function(){
				MooRTE.Utilities.assetLoader(
					{ scripts: ['/siteroller/classes/colorpicker/Source/ColorRoller.js'] 
					, styles:  ['/siteroller/classes/colorpicker/Source/ColorRoller.js'] 
					, onComplete:function(){}
					})
				}
			, click: function(){
				var empty = (Browser.Engine.gecko ? 'hilitecolor' : 'backcolor');
				}
			}
		}
	, insertImage:	{}
 	, foreColor:	{}			
 	, formatBlock:	{}
	, style: 		{}				
	, hilight:		{}
	, fontColor:	{}
	, fill:			{}
	, invisibleChars:{}
	, multiLevelList:	{'class':'wideIcon'}
	, paragraphSpacing:	{'class':'wideIcon'}
	, borderBottom:{}
	, changeStyles:{'class':'bigIcon'}
	, textEffect:	{'class':'bigIcon'}
	, insertPicture:{}
	, formatPainter:{}
	, find: 			{}
	, replace: 		{}
	, selection: 	{}
	, sort: 			{}
	, coverPage:{}
	, blankPage:{}
	, pageBreak:{}
	, table:{}
	, picture:{}
	, clipArt:{}
	, shapes:{}
	, smartArt:{}
	, chart:{}
	, screenshot:{}
	, hyperlink:{}
	, bookmark:{}
	, 'cross-reference':{}
	, header:{}
	, footer:{}
	, pageNumber:{}
	, textBox:{}
	, quickParts:{}
	, wordArt:{}
	, dropCap:{}
	, signatureLine:{}
	, dateTime:{}
	, object:{}
	, equation:{}
	, pasteMenu:{tag:'span'}
	/*, changeCase:
		{ 'class':'wideIcon', events:
			{ click: MooRTE.Utilities.flyout.pass('div.caseFlyouts:[sentencecase,lowercase,uppercase,wordCase,togglecase]')} 
		}
		*/
	,fontSize: {tag:'input', type:'text', value:11}
	,fontFamily:{tag:'input', type:'text', value:'Calibri (Body)'} 
	

	// Generic
	, Toolbar    	:{ tag:'div', title:'' } // Could use div.Toolbar, defined seperately for clarity.
};

Object.merge(MooRTE.Elements, MooRTE.BasicElements);