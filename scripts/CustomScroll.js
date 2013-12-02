// TODO добавить параметры для элементов. Учесть падинги и размеры контейнера
(function( $ ){
    var dragObject,
        elementOffset_top;

    function fixEvent(e) {
        // получить объект событие для IE
        e = e || window.event

        // добавить pageX/pageY для IE
        if ( e.pageX == null && e.clientX != null ) {
            var html = document.documentElement
            var body = document.body
            e.pageX = e.clientX + (html && html.scrollLeft || body && body.scrollLeft || 0) - (html.clientLeft || 0)
            e.pageY = e.clientY + (html && html.scrollTop || body && body.scrollTop || 0) - (html.clientTop || 0)
        }

        // добавить which для IE
        if (!e.which && e.button) {
            e.which = e.button & 1 ? 1 : ( e.button & 2 ? 3 : ( e.button & 4 ? 2 : 0 ) )
        }

        return e
    }
    
    function CSmoveY(_this, e, delta, y, animated) {
        var bottom = 0, //кордината нижней границы scrollbar
            CScontainer = _this.parent().parent(),
            CScontainerHeight = CScontainer.height(),
            CScontainerOffset = CScontainer.offset(),
            CScontentBlock = _this.parent().parent().find('div.CS_content'),
            CScontentBlockHeight = CScontentBlock.innerHeight(), //высота контентного блока
            scrollbarHeight = _this.height(),
            realHeight = CScontainerHeight - scrollbarHeight, //высота области container (scrolbar_wrapper) после вычета высоты scrollbar'а
            offsetScrollbar = 0, //смещение scrollbar в % + высота container'а
            offsetCScontentBlock = 0, //смещение CScontentBlock в px
			top = Math.round(_this.offset().top - CScontainerOffset.top);
		
		//проверка метода прокрутки
        if (!delta && y==undefined){//прокрутка scrollbar'ом
            top  = e.pageY - CScontainerOffset.top - elementOffset_top;
        } else if (y!==undefined) {//прокрутка кликом по scrollbar_wrapper'у
			top = y;
		} else if (delta != 0){//прокрутка колесом мышки
			top = top - (delta*10);
        }

        if (top < 0) {
            top = 0
        } else if ((top + scrollbarHeight) > CScontainerHeight) {
            top = CScontainerHeight - scrollbarHeight
        }
        
        bottom = top + scrollbarHeight;
        
        //передвижение scrollbar'а. Прокрутка срабатывает, когда выполняется условие ((top >= 0) && (bottom <= CScontainerHeight))
		if(animated){
			_this.animate({'top': top + 'px'},200);
		}else{
			_this.css({'top': top + 'px'});
		}
        //передвижение контента
        offsetScrollbar = (100*top)/realHeight;
        offsetCScontentBlock = ((CScontentBlockHeight-CScontainerHeight) * offsetScrollbar)/100;
		if(animated){
			CScontentBlock.animate({'top': - offsetCScontentBlock  + 'px'},200);
		}else{
			CScontentBlock.css({'top': - offsetCScontentBlock  + 'px'});
		}
		return false;
    }
 
    var CSmethods = {
		init : function( options ) {
			var settings = {
                'scrollbarHeight'     : 'auto',
				'contentBlockWidth'	  : 'auto'
			};
            
            return this.each(function() {
                var self = $(this);
                
				// если опции существуют, то совмещаем их со значениями по умолчанию
				if (options) { 
					$.extend( settings, options ); // при этом важен порядок совмещения
				}
                
                var content = self.html(),
                    container = self,
					containerPadding = container.css('padding-top') + ' ' + container.css('padding-right') + ' ' + container.css('padding-bottom') + ' ' + container.css('padding-left'),
                    contentBlock = $('<div class="CS_content" />').html(content).css({'padding': containerPadding}),
                    scrollbar = $('<div class="CS_scrollbar" />'),
                    scrollbar_wrapper = $('<div class="CS_scrollbar_wrapper" />').append(scrollbar),
					containerPaddingH = parseInt(contentBlock.css('padding-left')) + parseInt(contentBlock.css('padding-right')),
                    scrollbarHeight = 0, //высота scrollbar'а
					contentBlockWidth = 0; //ширина contentBlock

                container
                    .html('')
                    .append(contentBlock);
					
                if (container.height() > contentBlock.innerHeight()) {//показывать или нет scrollbar
					container.html(contentBlock.html());
					return false;
				}
                
                container.append(scrollbar_wrapper)
                    .addClass('CustomScroll')
					.css('padding','0px')
                    .on('mousewheel', function (e, delta) {
						var target = $(this).find('div.CS_scrollbar');
						CSmoveY(target,e,delta);
                        e.preventDefault();
                        e.stopPropagation();
						return false;
                    });
				
                if (settings['scrollbarHeight'] == 'auto') { //выставление высоты scrollbar
                    scrollbarHeight = Math.round(scrollbar_wrapper.height()*100/contentBlock.innerHeight());
                    if (scrollbarHeight < 10) {
                        scrollbarHeight = 10;
                    } else if (scrollbarHeight >= scrollbar_wrapper.height()) {
                        scrollbarHeight = scrollbar_wrapper.height() - 10;
                    }
                } else {
                    var scrollbarHeight = settings['scrollbarHeight'] + 'px';
                }
                scrollbar.css({'height' : scrollbarHeight});
				
				if (settings['contentBlockWidth'] == 'auto') {//получение ширины блока с контентом
					contentBlockWidth = container.width() - scrollbar_wrapper.width() - containerPaddingH
				} else {
					if (settings['contentBlockWidth'] > (container.width() - scrollbar_wrapper.width())) {
						contentBlockWidth = container.width() - scrollbar_wrapper.width()
					} else {
						contentBlockWidth = settings['contentBlockWidth'] - containerPaddingH
					}
				}
				contentBlock.width(contentBlockWidth);
				
                scrollbar.bind('mousedown', CSmethods.mDovn);
                scrollbar_wrapper.bind('mousedown', CSmethods.sBarWClick);
			});
		},
        mDovn : function(e) {
            e = fixEvent(e);
            if (e.which != 1) return
            dragObject  = this
            
            // получить сдвиг элемента относительно курсора мыши
            elementOffset_top = e.pageY - $(this).offset().top;

            // эти обработчики отслеживают процесс и окончание переноса
            $(document).bind('mousemove', CSmethods.mMove);
            $(document).bind('mouseup', CSmethods.mUp);            

            // отменить перенос и выделение текста при клике на тексте
            document.ondragstart = function() {return false }
            $('body *').each(function() {//запрет на выделение контента во время скролинга
                this.onselectstart = function() { return false; };
                this.unselectable = "on";
                jQuery(this).css('-moz-user-select', 'none');
            }); 
        },
        mUp : function(e) {
            dragObject = null;
            
            // очистить обработчики, т.к перенос закончен
            $(document).unbind('mousemove', CSmethods.mMove);
            $(document).unbind('mouseup', CSmethods.mUp); 
            document.ondragstart = null
            $('body *').each(function() {//убираем запрет на выделение контента во время скролинга
                this.onselectstart = function() {};
                this.unselectable = "off";
                jQuery(this).css('-moz-user-select', 'auto'); 
            }); 
        },
        mMove : function(e) {
            if (dragObject) {
				var target = $(dragObject);
                e = fixEvent(e);
                CSmoveY(target, e);
                return false;
            }
        },
        sBarWClick : function(e) {
            e = fixEvent(e);
            if ((e.which == 1) && (dragObject == null)) {
                var y = e.pageY - $(this).parent().offset().top - $(this).children().height()/2,
					target = $(this).children();
                CSmoveY(target, e, 0, y, true);
            }
        },
		scrollTo : function(y){		
			var h = $(this).find('.CS_content').outerHeight(),
			top = (y/h)*$(this).find('.CS_scrollbar_wrapper').outerHeight(),
			target = $(this).find('.CS_scrollbar');
			CSmoveY(target, 0, 0, top, true);
		},
		scrollToElem : function($elem){		
			var toY = $(this).find($elem).position().top;
			$(this).CustomScroll('scrollTo', toY);
		}
	};
	
	$.fn.CustomScroll = function ( method ) {
		// логика вызова метода
		if ( CSmethods[method] ) {
		  return CSmethods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === 'object' || ! method ) {
		  return CSmethods.init.apply( this, arguments );
		} else {
		  $.error( 'Метод ' +  method + ' в jQuery.CustomScroll не существует' );
		}    
	};
})( jQuery );