chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('sole64.html', {
		'bounds': {
			'width': 900,
	        'height': 700
		}
	});
});
