
var mottos = ['実験サイト','勉強サイト','自己満足サイト','砂場', '粒子遊び', '生成芸術'];

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
	
	var time = 800;
	
	//header
	$('header>h1>span:eq(0)').stop().animate({color:textColor1}, time);
	$('header>h1>span:eq(1)').stop().animate({color:subColor1}, time);
	$('header>h1>span:eq(2)').stop().animate({color:textColor3}, time);
	$('header>h1>span:eq(3)').stop().animate({color:subColor2}, time);
	$('header>h1>span:eq(4)').stop().animate({color:textColor3}, time);
	
	var prevIdx = (currentIndex==0) ? siteinfo.length-1 : currentIndex-1;
	var nextIdx = (currentIndex==siteinfo.length-1) ? 0 : currentIndex+1;
	//prev
	var prevPath = $("#prev_arrow").svg('get').getElementById("prev_arrow_path");
	$(prevPath).animate({svgFill:textColor3}, time);
	
	$('#prev_arrow').unbind()
	.click(function(){
		if(currentIndex!=prevIdx)	$.address.value( String(prevIdx+1) );
		return false;
	}).hover(
		function(){
			$(prevPath).stop().animate({svgFill:siteinfo[prevIdx].themeColor}, 1);
		},
		function(){
			$(prevPath).stop().animate({svgFill:textColor3});
		}
	)
	
	//next
	var nextPath = $("#next_arrow").svg('get').getElementById("next_arrow_path");
	$(nextPath).animate({svgFill:textColor3}, time);
	$('#next_arrow').unbind()
	.click(function(){
		if(currentIndex!=nextIdx)	$.address.value( String(nextIdx+1) );
		return false;
	}).hover(
			function(){
				$(nextPath).stop().animate({svgFill:siteinfo[nextIdx].themeColor}, 1);
			},
			function(){
				$(nextPath).stop().animate({svgFill:textColor3});
			}
		);
	
	
	//heading number
	$('section>h1').text(String(100+n+1).substr(1,2));
	$('section>h1').stop().animate({color:themeColor},1500);

	//border
	$('div#content_info').css({borderLeftColor:textColor3});
	
	//menus
	$.each( siteinfo, function(i, item){
		var a =  $('ul#content_menus>li:eq('+i+')>a' );
		a.unbind('mouseover', 'mouseout');
		if(i==currentIndex){
			a.animate({color:siteinfo[i].themeColor},time);
			a.hover(
				//mouseover
				function(){ 
					$(this).stop().animate({color:siteinfo[i].themeColor});
				},
				//mouseout
				function(){ 
					$(this).stop().animate({color:siteinfo[i].themeColor});
				}
			);
		}else{
			a.animate({color:textColor3}, time);
			a.hover(
				//mouseover
				function(){ 
					$(this).stop().animate({color:siteinfo[i].themeColor}, 1);
				},
				//mouseout
				function(){ 
					$(this).stop().animate({color:textColor3});
				}
			);
		}
	})
	
	//text
	$('section>p').html(text).animate({color:textColor2}, time);
	
	//footer
	$('div.tate-line').stop().animate({color:textColor2}, time);
	$('div.copyright').stop().animate({color:textColor3}, time);
	
	//content
		$('<div class="cover_rect"/>')
		.css({backgroundColor:backgroundColor})
		.prependTo($('div#content'))
		.animate({opacity:1}, time, function(){	
			$('body').css({backgroundColor:backgroundColor});
			$('div#content>iframe').remove();
			$('<iframe/>').attr('src', link).appendTo($('div#content'));

			$('iframe').load(function(){
				$('div.cover_rect').delay(100).animate({opacity:0}, time, 'linear', function(){ $(this).remove(); });
			})
			
			
		});
	
	
	//title
	document.title = "playpit | " + $('section>h1').text();
	
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
	$('<span>.</span><span>kowareru</span><br/>').appendTo($('header>h1'));
	$('<span>.</span><span>com</span>').appendTo($('header>h1'));
	
	//menus
	$.each( siteinfo, function(i, item){
		var list = $('<li/>');
		var a = $('<a>●</a>').attr("href", item.link);
		a.click(
			function(){
				if(currentIndex!=i){
					$.address.value( String(i+1) );
				}
				return false;
			}
		);
		list.append(a);
		list.appendTo($('#content_menus'));
	})
	
	//jquery address
	$.address.change(function(event){
		var n = Number($.address.value().substr(1)) -1;
		if(n==-1){
			n = siteinfo.length-1;
		}
		if(currentIndex!=n) {
			update( n );
		}
	})
	
	//update
	var n = Number($.address.value().substr(1) )-1;
	if(n==-1){
		n = siteinfo.length-1;
	}
	update(n);
	
}


$(document).ready(function(d){
	
	if(Math.random()<0.5){
		$('div.tate-line').text( mottos[Math.floor(Math.random()*mottos.length)] );
	}

		//prev
		$('#prev_link>a').remove();
		$('<div id="prev_arrow" />')
		.width(12).height(10).css('cursor', 'pointer')
		.appendTo($('#prev_link'))
		.svg().load('/common/images/prev_arrow.svg',{onLoad:function(){console.log('prev')}});

		//next
		$('#next_link>a').remove();
		$('<div id="next_arrow" />')
		.width(12).height(10).css('cursor', 'pointer')
		.appendTo($('#next_link'))
		.svg().load('/common/images/next_arrow.svg',{onLoad:function(){console.log('next')}});
		
		//load json
		$(window).load(function(){
			console.log('load')
			$.getJSON('index.json', 
				function(data){
					siteinfo = data;
					init();
					console.log('json')
				});
		});

})




