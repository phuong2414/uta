var Query = function() {
	this.init.apply(this, arguments);
};

Query.prototype = {
	clm: com.veeva.clm,

	init: function(type, fields, callback) {
		this.type = type;
		this.fields = fields;
		this.callback = callback;

		this.returnData = {};
		this.count = 0;
	},

	start: function() {
		this._query();
	},

	_next: function() {
		this.count++;
		if (this.count >= this.fields.length) {
			if (this.callback) this.callback(this.returnData);
		} else {
			this._query();
		}
	},

	_query: function() {
		var handler = $.proxy(this._queryCallback, this),
			type = this.type,
			count = this.count,
			field = this.fields[count];
		this.clm.getDataForCurrentObject(type, field, handler);
	},

	_queryCallback: function(result) {
		if (result.success) {
			var type = this.type,
				count = this.count,
				field = this.fields[count],
				value = result[type][field];
			if (value == type + "." + field) value = "";
			this.returnData[field] = value;
		}
		
		this._next();
	}
};

function getVeevaData(type, fields, callback) {
	var player = drcom.config.player;
	if (player === "Veeva" || player === "Engage") new Query(type, fields, callback).start();
	else callback({});
}

function saveVeevaData(type, data, callback) {
	com.veeva.clm.createRecord(type, data, callback);
}

function updateVeevaData(type, ID, values, callback) {
	var player = drcom.config.player;
	if (player === "Veeva" || player === "Engage") {
		com.veeva.clm.updateRecord(type, ID, values, callback);
	} else {
		callback({success: true});
	}
}