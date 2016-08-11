var app = app || {};

app.vent = _.extend({}, Backbone.Events);

app.AppView = Backbone.View.extend({
	events: {
		'click .hamburger-icon' : 'app.SidebarView.toggleSidebar',
	},

	// Add new list item view when new daily journal is added to collection
	initialize: function() {
		this.listenTo(app.Journals, 'add', this.addDateEntry);

		app.vent.on('editJournal', this.showJournal, this);
		app.vent.on('foodQuery', this.foodQuery, this);
	},

	// Function for creating a new list item view and appending it to DOM
	// based on its index in collection
	addDateEntry: function(date) {
		var index = date.collection.indexOf(date);
		var currentListLength = $('.date-list').children().length;
		var view = new app.ListView({model: date});

		if ((currentListLength) && (currentListLength > index)) {
			$('.date-list li').eq(index).before(view.render().el);
		} else {
			$('.date-list').append(view.render().el);
		}
	},

	// Function for creating a new journal edit view and rendering it
	showJournal: function(journal) {
		var journal = new app.JournalView({model: journal});

		$('.journal').html(journal.render().el);
	},

	parseResults: function(data) {
		var parsedResult, calories, brandName, serving, HTMLString;
		var results = [];

		$('.search-results').html('');

		$.each(data.hits, function(index, item) {
			if (item.fields.brand_name === 'USDA') {
				brandName = '';
				serving = '';
			} else {
				brandName = item.fields.brand_name;
				serving = ' - ' + item.fields.nf_serving_size_qty +
				 ' ' + item.fields.nf_serving_size_unit;
			}

			parsedResult = brandName + ' ' + item.fields.item_name +
				serving;
			calories = item.fields.nf_calories;

			var result = new app.SearchView();
			$('.search-results').append(result.render(parsedResult).el);

			results.push({foodName: parsedResult, calories: calories});
		});

		localStorage.setItem('results', JSON.stringify(results));
	},

	foodQuery: function(query) {
		var triggerObject = {};
		_.extend(triggerObject, Backbone.Events);
		triggerObject.bind('parseResults', this.parseResults, this);

		var nutritionixURL = 'https://api.nutritionix.com/v1_1/search/' + query +
		'?fields=item_name%2Cbrand_name%2Cnf_calories&appId=6962db3c&appKey=' +
		'304283206c5423bc90fada2876453cc7';

		$.ajax({
			url: nutritionixURL
		})
		.done(function(data) {
			triggerObject.trigger('parseResults', data);
		})
		.fail(function() {

		});
	},

	addFood: function(food) {
		app.vent.trigger('addFood', food);
		console.log("addFood function triggered in Appview");
	}
});