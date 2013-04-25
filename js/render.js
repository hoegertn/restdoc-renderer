/**
 * @param file Path to the json file (e.g. test.json or http://domain.de/test.json
 * @param cbBefore function(restdoc) executed before rendering happens (can be undefined)
 * @param contentElement element where the content is inserted (e. g. $("#test"))
 * @param cbAfter function(restdoc) executed after rendering happened (can be undefined)
 */
function render(file, cbBefore, contentElement, cbAfter) {
	$.ajax({
		url : file,
		success : function (restdoc) {
			if (typeof cbBefore === "function") {
				cbBefore(restdoc);
			}
			var output = "";
			output += createSchemaSection(restdoc.schemas);
			output += createHeaderSection(restdoc.headers);
			output += createResourceSection(restdoc.resources);
			output += createParamSection(restdoc.params);
			contentElement.html(output);
			if (typeof cbAfter === "function") {
				cbAfter(restdoc);
			}
		},
		error : function (e) {
			contentElement.html("Error loading RestDoc: " + e);
		},
		dataType : "json"
	});
}

function crateSchemaList(restdoc, appendElement) {
	var output = "";
	var i = 0;
	for (var id in restdoc.schemas) {
		if (restdoc.schemas.hasOwnProperty(id)) {
			var schema = restdoc.schemas[id];
			output += "<li><a href=\"#schema-" + i +"\">" + id + "</a></li>";
			i += 1;
		}
	}
	appendElement.append(output);
}

function crateResourceList(restdoc, appendElement) {
	var output = Mustache.render("{{#resources}}<li><a href=\"#resource-{{id}}\" data-toggle=\"collapse\" data-parent=\"#accordion-res\">{{path}}</a></li>{{/resources}}", restdoc);
	appendElement.append(output);
}

function crateParamList(restdoc, appendElement) {
	var output = "";
	var i = 0;
	for (var id in restdoc.params) {
		if (restdoc.params.hasOwnProperty(id)) {
			var param = restdoc.params[id];
			output += "<li><a href=\"#param-" + i +"\">" + id + "</a></li>";
			i += 1;
		}
	}
	appendElement.append(output);
}

function createSchemaSection(schemas) {
	var html = '<h2>Schemas</h2><div class="accordion" id="accordion-res">';
	var i = 0;
	for (var id in schemas) {
		if (schemas.hasOwnProperty(id)) {
			html += createSchema(i, id, schemas[id]);
			i += 1;
		}
	}
	html += '</div>';
	return html;
}

function createSchema(i, schemaURI, schema) {
	var html = '<div class="accordion-group">'
		+ '<div class="accordion-heading">'
			+ '<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion-res" href="#schema-' + i + '">'
			+ '<h4>' + schemaURI + ' <i class="icon-resize-vertical icon-4x"></i></h4>'
			+ '</a>'
		+ '</div>';

	html += '<div id="schema-' + i + '" class="accordion-body collapse"><div class="accordion-inner">';
	if (schema.type === "url") {
		html += '<h5>URL</h5>';
		html += '<p>' + schema.url + '</p>';
	} else if (schema.type === "inline") {
		html += '<h5>Type</h5>';
		html += '<p>' + schema.schema.type + '</p>';
		html += '<h5>Properties</h5><ul>';
		for (var id in schema.schema.properties) {
			if (schema.schema.properties.hasOwnProperty(id)) {
				var property = schema.schema.properties[id];
				html += "<li><code>" + id + "</code>: " + property.type + "</li>"
			}
		}
		html += "</ul>";
	} else {
		html += "<p>Unsupported type " + schema.type + "</p>";
	}
	html += '</div></div></div>';
	return html;
}

function createHeaderSection(headers) {
	var html = '<div class="restdoc-headers" id="headers">';
	html += '<h2>Global headers</h2>';
	html += '<a name="header-request"></a>';
	html += createHeaderList('h3', 'Request', headers.request);
	html += '<a name="header-response"></a>';
	html += createHeaderList('h3', 'Response', headers.response);	
	html += '</div>';
	return html;
}

function createHeaderList(st, title, headers) {
	var html = '<'+st+'>' + title + '</'+st+'>';
	html += '<ul>';
	for (var prop in headers) {
		if (headers[prop].required && headers[prop].required === true) {
			var req = '';
		} else {
			var req = ' <small><em>(optional)</em></small>';
		}
		html += listItem(prop, headers[prop].description + req);	
	}
	html += '</ul>';
	return html;
}

function createResourceSection(data) {
	var html = '<h2>Resources</h2><div class="accordion" id="accordion-res">';
	
	for (var i = 0; i < data.length; i++) {
		html += createResource(data[i]);
	}
	html += '</div>';
	return html;
}

function createResource(res) {
	var desc = res.description ? res.description : 'No description';
	
	var html = '<div class="accordion-group">';
	html += '<div class="accordion-heading">';
	html += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion-res" href="#resource-' + res.id + '">';
	html += '<h4>' + res.path + ': ' + desc + ' <i class="icon-resize-vertical icon-4x"></i></h4></a></div>';
	
	html += '<div id="resource-' + res.id + '" class="accordion-body collapse"><div class="accordion-inner">';
	
	html += '<h5>Identifier</h5>';
	html += '<p>' + res.id + '</p>';
	
	html += '<h5>Parameters</h5>';
	html += createResourceParamSection(res.params);
	
	html += '<h5>Methods</h5><div class="accordion" id="accordion-'+res.id+'-method">';
	for (var prop in res.methods) {
		html += createResourceMethodSection(res.id, prop, res.methods[prop]);
	}
	html += '</div>'; // Method accordion
	
	html += '</div></div></div>';
	return html;
}

function createResourceParamSection(params) {
	var html = '<div class="restdoc-params well well-small">';
	html += '<ul>';
	for (var prop in params) {
		var req = '';
		if (params[prop].validations) {
			for (var i = 0; i < params[prop].validations.length; i++) {
				if (params[prop].validations[i].type === 'match') {
					req = ' (<code>' + params[prop].validations[i].pattern + '</code>)';		
				}
			}
		}
		html += listItem(prop, params[prop].description + req);
	}
	html += '</ul></div>';
	return html;
}

function createResourceMethodSection(res, name, method) {
	var desc = (method.description) ? method.description : 'No description';

	var html = '<div class="accordion-group">';
	html += '<div class="accordion-heading">';
	html += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion-'+res.id+'-method" href="#collapseMethod' + res+'-'+name + '">';
	html += '<p><span class="label label-info">' + name + '</span> ' + desc + ' <i class="icon-resize-vertical icon-large"></i></p></a></div>';
	
	html += '<div id="collapseMethod' + res+'-'+name + '" class="accordion-body collapse"><div class="accordion-inner">';
	if (method.headers) {
		html += createHeaderList('h6', 'Headers', method.headers);	
	}
	if (method.accepts) {
		html += createAccept('Accepts', method.accepts);
	}
	if (method.statusCodes) {
		html += createStatusCodes(method.statusCodes);
	}
	if (method.response && method.response.headers) {
		html += createHeaderList('h6', 'Response headers', method.response.headers);	
	}
	if (method.response && method.response.types) {
		html += createAccept('Response types', method.response.types);
	}
	html += '</div></div></div>';
	return html;
}

function createAccept(title, accepts) {
	var html = '<h6>'+title+'</h6><ul>';
	for (var i = 0; i < accepts.length; i++) {
		var acc = accepts[i];
		var schema = (acc.schema) ? 'Schema: ' + acc.schema : '';
		html += listItem(acc.type, schema);
	}
	html += '</ul>';
	return html;
}

function createStatusCodes(codes) {
	var html = '<h6>Return codes</h6><ul>';
	for (var code in codes) { 
		html += listItem(code, codes[code]);
	}
	html += '</ul>';
	return html;
}

function createParamSection(params) {
	var html = '<h2>Params</h2>';
	html += '<ul>';
	for (var prop in params) {
		var req = '';
		if (params[prop].validations) {
			for (var i = 0; i < params[prop].validations.length; i++) {
				if (params[prop].validations[i].type === 'match') {
					req = ' (<code>' + params[prop].validations[i].pattern + '</code>)';
				}
			}
		}
		html += listItem(prop, params[prop].description + req);
	}
	html += '</ul>';
	return html;
}

function listItem(title, text) {
	var html = '<li><code>' + title + '</code>';
	if (text) {
		html += ' ' + text;
	}
	html += '</li>';
	return html;
}