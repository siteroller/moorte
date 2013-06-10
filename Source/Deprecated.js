// TabGroup Triggers. Samples, these can be created dynamically or manually.
MooRTE.GroupsDeprecated = 	// Default Word03/Tango Groups. Could be integrated into MooRTE.Elements, but neater seperate.
	{ Main : 'Toolbar:[start,bold,italic,underline,strikethrough,Justify,Lists,Indents,subscript,superscript]'
	, File : {Toolbar:['start','save','cut','copy','paste','redo','undo','selectall','removeformat','viewSource']}
	, Font : {Toolbar:['start','fontsize','decreaseFontSize','increaseFontSize','backcolor','forecolor']}
 	, Sert : {Toolbar:['start','inserthorizontalrule', 'blockquote','hyperlink']}
	, RibbonOpts	:{ place:'Ribbons'}

	// Other deprecated elements. Or those waiting till dev on the Word03 skin starts again.
	, Main			:{text:'Main'  , 'class':'rteText', load :{tabs: [MooRTE.Groups.Main, 'tabs1', null]} ,click:'load'}
   , File			:{text:'File'  , 'class':'rteText rteFile', click:{tabs: [MooRTE.Groups.File, 'tabs1', null]} }
   , Font			:{text:'Font'  , 'class':'rteText', click:{tabs: [MooRTE.Groups.Font, 'tabs1', null]} }
 	//, Insert			:{text:'Insert', 'class':'rteText', click:{tabs: [MooRTE.Groups.Sert, 'tabs1', null]} } //'Upload Photo'
   , View			:{text:'Views' , 'class':'rteText', click:{tabs: {Toolbar:['start','Html/Text']}} }
   , Indents: {'class':'Flyout', contains:'div.Flyout:[indent,outdent]' }
   , Justify:
   	{ 'class':'Flyout rteSelected', contains:'div.Flyout:[justifyleft,justifycenter,justifyright,justifyfull]' }
   , input:  {click:function(){ MooRTE.Range.insert("<input>") } }
   , submit:   {click:function(){ MooRTE.Range.insert('<input type="submit" value="Submit">') }}	
   , fontSize:	{ tag:'span.flyout', contains:'inputFontSize', click:{flyout:['fontSizeFlyouts']} }
   , inputFontSize:{ tag:'input', type:'text', value:12 }
   , fontDropdown:{ tag:'div', contains:"'input[type=text]',div.f_calibri,div.f_tahoma,div.f_comic"}
	/*
   , changecase:	{ click:{flyout:['div.caseFlyouts:[sentencecase,lowercase,uppercase,wordcase,togglecase]']} }
   , changecase2:
   	{ click:{tabs:
			['flyouts', 'div.caseFlyouts:[sentencecase,lowercase,uppercase,wordcase,togglecase]'
			, {place:'Flyouts', events:{show:
					function(flyout){
						var pos = this.getCoordinates(this.getParent('.MooRTE'));
						flyout.content.setPosition({x:pos.left, y:pos.height + pos.top + 1});
						}
					}}
				]}
		}
	*/
	}	