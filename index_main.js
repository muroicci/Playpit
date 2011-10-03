
var siteinfo;
var currentIndex;
var link;
var backgroundColor;
var textColor1;
var textColor2;
var textColor3;
var themeColor;
var subColor1;
var subColor2;
var text;

function update(n){

	//info
	currentIndex = n;
	link = siteinfo[currentIndex].link;
	backgroundColor = siteinfo[currentIndex].backgroundColor;
	textColor1 = siteinfo[currentIndex].textColor1;
	textColor2 = siteinfo[currentIndex].textColor2;
	textColor3 = siteinfo[currentIndex].textColor3;
	themeColor = siteinfo[currentIndex].themeColor;
	subColor1 = siteinfo[currentIndex].subColor1;
	subColor2 = siteinfo[currentIndex].subColor2;
	text = siteinfo[currentIndex].text;
	
	//background
	$('body').css({backgroundColor:backgroundColor})

	//header
	$('header>h1>span:eq(0)').css({color:textColor1});
	$('header>h1>span:eq(1)>span').css({color:subColor1});
	$('header>h1>span:eq(1)').css({color:textColor3});
	$('header>h1>span:eq(2)>span').css({color:subColor2});
	$('header>h1>span:eq(2)').css({color:textColor3});
	
	//heading number
	$('section>h1').text(String(100+n+1).substr(1,2));
	$('section>h1').css({color:themeColor});

	//border
	$('div#content_info').css({borderLeftColor:textColor3});
	
	//menus
	$.each( siteinfo, function(i, item){
		var a =  $('ul#content_menus>li:eq('+i+')>a' );
		if(i==currentIndex){
			a.css({color:siteinfo[i].themeColor});
			a.hover(
				//mouseover
				function(){ 
					$(this).css({color:siteinfo[i].themeColor});
				},
				//mouseout
				function(){ 
					$(this).css({color:siteinfo[i].themeColor});
				}
			);
		}else{
			a.css({color:textColor2});
			a.hover(
				//mouseover
				function(){ 
					$(this).css({color:siteinfo[i].themeColor});
				},
				//mouseout
				function(){ 
					$(this).css({color:textColor2});
				}
			);
		}
	})
	
	//text
	$('section>p').text(text);
	$('section>p').css({color:textColor2});
	
	//footer
	$('div.tate-line').css({color:textColor2});
	$('div.copyright').css({color:textColor3});
	
	//content
	$('iframe').attr('src', link);
	
	//widon't
	jQuery(function($){
	    $('p').each(
	        function(){
	            $(this).html($(this).html().replace(/([^\s])\s+([^\s]+)\s*$/, '$1&nbsp;$2'));
	        }
	    );
	});
	
}


function init(){
	
	//header
	$('header>h1').empty();
	$('<span>playpit</span><br/>').appendTo($('header>h1'));
	$('<span><span>.</span>kowareru</span><br/>').appendTo($('header>h1'));
	$('<span><span>.</span>com</span>').appendTo($('header>h1'));
	
	
	//next prev
	
	//menus
	$.each( siteinfo, function(i, item){
		var list = $('<li/>');
		var a = $('<a>●</a>').attr("href", item.link);
		a.click(
			function(){
				if(currentIndex!=i){
					update(i);
				}
				return false;
			}
		);
		list.append(a);
		list.appendTo($('#content_menus'));
	})
	
}



$(document).ready(function(d){
	
	$.getJSON('index.json', 
		function(data){
			siteinfo = data;
			init();
			update( data.length-1 );
	});
	
})


