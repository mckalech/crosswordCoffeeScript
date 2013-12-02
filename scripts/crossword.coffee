class Crossword	
	
	typingHorizontal : true
	clickCounter : 0
	
	constructor: (@crosswordData) ->
		@$container = $('.crossword__container')
		@$questionsContainer = $('.questions')
		@createCrosswordTable()	
		@createQuestionsList()
		@bindHandlers()
	
	bindHandlers : ->
		#cell clicking#
		@$clickable.on 'click', (e) =>			
			$clickedTd = $(e.target)
			sides = @canSides($clickedTd)
			
			$prevActiveTd = @$clickable.filter('.active')
			@$clickable.removeClass('active')
			$clickedTd.addClass('active')	
			@clickCounter = if $prevActiveTd.hasClass('active') then @clickCounter+1 else 1;
			
			if (sides.nextHorizontal or sides.prevHorizontal) and (sides.nextVertical or sides.prevVertical) 			
				if $clickedTd.hasClass('word') and @clickCounter == 1 				
					yes							
				if @clickCounter == 1 
					@chooseCells($clickedTd, true)
				else 
					if @typingHorizontal 
						@chooseCells($clickedTd, false)
					else
						@chooseCells($clickedTd, true)

			if not(sides.nextHorizontal or sides.prevHorizontal) and (sides.nextVertical or sides.prevVertical)		
				@chooseCells($clickedTd,false)
			
			if (sides.nextHorizontal or sides.prevHorizontal) and not(sides.nextVertical or sides.prevVertical) 	
				@chooseCells($clickedTd, true)
			yes
		
		#keys#
		$(document).live 'keypress', (e) =>		
			$activeTd=@$clickable.filter('.active')
			
			if $activeTd.length and e.keyCode!=32 and e.keyCode!=13
				sides = @canSides($activeTd)
				#letters#
				$activeTd.text(String.fromCharCode(e.keyCode))
				if @typingHorizontal 				
					$activeTd.removeClass('active').next().addClass('active') if sides.nextHorizontal 	
				else if sides.nextVertical 
					tdIndX = $activeTd.parent().find('td').index($activeTd)
					$activeTd.removeClass('active').parent().next().find('td').eq(tdIndX).addClass('active')
			yes	
		
		$(document).live 'keydown', (e) =>
			$activeTd = @$clickable.filter('.active')		
			if $activeTd.length 
				sides = @canSides($activeTd)
				tdIndX = $activeTd.parent().find('td').index($activeTd)
				
				switch e.keyCode
					when 32 then $activeTd.trigger('click')
					when 37 
						if sides.prevHorizontal
							$activeTd.removeClass('active').prev().addClass('active')
							@chooseCells($activeTd, true)
					when 39 
						if sides.nextHorizontal
							$activeTd.removeClass('active').next().addClass('active')
							@chooseCells($activeTd, true)
					when 38 
						if sides.prevVertical
							$activeTd.removeClass('active').parent().prev().find('td').eq(tdIndX).addClass('active')
							@chooseCells($activeTd, false)
					when 40 
						if sides.nextVertical
							$activeTd.removeClass('active').parent().next().find('td').eq(tdIndX).addClass('active')
							@chooseCells($activeTd, false)
					when 8
						$activeTd.text('')
						if @typingHorizontal and sides.prevHorizontal
							$activeTd.removeClass('active').prev().addClass('active')
						else if not @typingHorizontal and sides.prevVertical
							$activeTd.removeClass('active').parent().prev().find('td').eq(tdIndX).addClass('active')

			e.preventDefault() if e.keyCode in [32, 37, 38, 39, 40, 8]
			yes
			
		#вопросы	#	
		@$questionsContainer.find('li').on 'click', (e)=>
			$self = $(e.target)
			num = $self.attr('data-number')
			isHorizontal = if @crosswordData.wordsList[num].horizontal then true else false
			$firstCell = @$clickable.filter("[data-content='#{num}']")			
			@$questions.removeClass('active')
			$self.addClass('active')
			@$clickable.removeClass('active')	
			$firstCell.addClass('active')
			@chooseCells($firstCell, isHorizontal)		
			yes
		
		#return bindHandlers()#
		yes
		
	createCrosswordTable : ->
	#creating table#
		$table = $('<table />').addClass('crossword__table')
		for i, crossString of @crosswordData.lettersTable
			$table.append('<tr />')
			for j, crossCell of @crosswordData.lettersTable[0] 
				newCell = $('<td />')
				newCell.addClass('clickable') if @crosswordData.lettersTable[i][j]
				newCell.appendTo($table.find('tr').last())
				
		$table.appendTo(@$container)		
		@$clickable = $table.find('.clickable')	
		#adding data atributes to num words in table#
		for number, word of @crosswordData.wordsList
			$table.find('tr').eq(word.start[0]).find('td').eq(word.start[1]).attr('data-content',number)
		yes
	
	#choosing cells params (cell, typing horizontal:true/false)#
	chooseCells : ($cell, tpHr) ->
		@$clickable.removeClass('word')		
		$nextTd = $cell
		@typingHorizontal = tpHr
		
		if @typingHorizontal 
			while $nextTd.hasClass('clickable')	
				$nextTd.addClass('word')
				$nextTd = $nextTd.next()			
			$prevTd=$cell.prev()
			while $prevTd.hasClass('clickable')
				$prevTd.addClass('word')
				$prevTd = $prevTd.prev()
		else	
			tdIndX = $cell.parent().find('td').index($cell)
			while $nextTd.hasClass('clickable')
				$nextTd.addClass('word')
				$nextTd = $nextTd.parent().next().find('td').eq(tdIndX)
			$prevTd = $cell.parent().prev().find('td').eq(tdIndX)					
			while $prevTd.hasClass('clickable')
				$prevTd.addClass('word');
				$prevTd=$prevTd.parent().prev().find('td').eq(tdIndX)		
		@chooseQuestion($cell)
		yes
		
	canSides : ($cell) ->
		tdIndX=$cell.parent().find('td').index($cell)
		sides = 
			nextHorizontal : $cell.next().hasClass('clickable')
			prevHorizontal : $cell.prev().hasClass('clickable')
			nextVertical : $cell.parent().next().find('td').eq(tdIndX).hasClass('clickable')
			prevVertical : $cell.parent().prev().find('td').eq(tdIndX).hasClass('clickable')	
		sides
	
	createQuestionsList : ->		
		
		@$qBlockV = $('<div />').addClass('questions__block').addClass('questions__block_vertical')
		@$qBlockH = $('<div />').addClass('questions__block').addClass('questions__block_horizontal')
		$qListV = $('<ul />').appendTo(@$qBlockV)
		$qListH = $('<ul />').appendTo(@$qBlockH)
		
		for number, word of @crosswordData.wordsList
			newItemText = "#{number}) #{word.q}"
			$newItem = $('<li />').attr('data-number',number).text(newItemText)
			if word.horizontal
				$newItem.appendTo($qListH)
			else
				$newItem.appendTo($qListV)
						
		@$qBlockH.add(@$qBlockV).appendTo(@$questionsContainer).CustomScroll()
		@$questions = @$questionsContainer.find('li')
		yes
	
	chooseQuestion : ($cell) ->
		
		number = @findFirstCell($cell)
		
		if @typingHorizontal
			@$qBlockH.CustomScroll('scrollToElem',"li[data-number='#{number}']")
		else
			@$qBlockV.CustomScroll('scrollToElem',"li[data-number='#{number}']")
		@$questions.removeClass('active').filter("[data-number='#{number}']").addClass('active')
		yes

	findFirstCell : ($cell) ->
		$prevTd = $cell;
		if @typingHorizontal
			while $prevTd.prev().hasClass('clickable')
				$prevTd=$prevTd.prev()
		else
			tdIndX=$cell.parent().find('td').index($cell);
			while $prevTd.parent().prev().find('td').eq(tdIndX).hasClass('clickable')
				$prevTd=$prevTd.parent().prev().find('td').eq(tdIndX)

		$prevTd.attr('data-content');
window.Crossword	= Crossword;