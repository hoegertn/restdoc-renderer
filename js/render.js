var schemasByURI = {};

function crateSchemaList(restdoc, appendElement) {
	var output = "", i = 0, schemas = [];
	for (var id in restdoc.schemas) {
		if (restdoc.schemas.hasOwnProperty(id)) {
			var s = id.split("/");
			schemas.push({"id": i, "name": s[s.length-1]});
			i += 1;
		}
	}
	schemas.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	$.each(schemas, function(i, schema) {
		output += "<li><a href=\"#schema-" + schema.id +"-anchor\">" + schema.name + "</a></li>";
	});
	appendElement.after(output);
}

function crateResourceList(restdoc, appendElement) {
	var output = "", resources = [];
	$.each(restdoc.resources, function(i, resource) {
			resources.push({"id": resource.id, "name": resource.path});
	});
	resources.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	$.each(resources, function(i, resource) {
		output += "<li><a href=\"#resource-" + resource.id +"-anchor\">" + resource.name + "</a></li>";
	});
	appendElement.after(output);
}

function crateParamList(restdoc, appendElement) {
	var output = "", i = 0, params = [];
	for (var id in restdoc.params) {
		if (restdoc.params.hasOwnProperty(id)) {
			params.push({"id": i, "name": id});

			i += 1;
		}
	}
	params.sort(function(a, b) {
		return a.name.localeCompare(b.name);
	});
	$.each(params, function(i, param) {
		output += "<li><a href=\"#param-" + param.id +"-anchor\">" + param.name + "</a></li>";
	});
	appendElement.after(output);
}

function createSchemaSection(schemas) {
	var html = '<h2 id="schemas-anchor">Schemas</h2><div class="accordion" id="accordion-res">';
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

function createInlineSchema(schema) {
	var html = "";
	if (schema.type === "object") {
		html += "<ul>";
		for (var id in schema.properties) {
			if (schema.properties.hasOwnProperty(id)) {
				var property = schema.properties[id];
				if (property.type === "array") {
					html += "<li><code>" + id + "</code>: " + property.type + "[" + property.items.type + "]";
					html += createInlineSchema(property);
					html += "</li>";
				} else if (property.type === "object") {
					html += "<li><code>" + id + "</code>: " + property.type;
					html += createInlineSchema(property);
					html += "</li>";
				} else {
					html += "<li><code>" + id + "</code>: " + property.type + "</li>";
				}
			}
		}
		html += "</ul>";
	} else if (schema.type === "array") {
		if (schema.items.type === "array" || schema.items.type === "object") {
			html += createInlineSchema(schema.items);
		}
	}
	return html;
}
function createSchema(i, schemaURI, schema) {
	schemasByURI[schemaURI] = i;
	var html = '<div class="accordion-group" id="schema-' + i + '-anchor">' +
		'<div class="accordion-heading">' +
			'<a class="accordion-toggle" data-toggle="collapse" data-parent="#accordion-res" href="#schema-' + i + '">' +
			'<h4>' + schemaURI + ' <i class="icon-resize-vertical icon-4x"></i></h4>' +
			'</a>' +
		'</div>';

	html += '<div id="schema-' + i + '" class="accordion-body collapse"><div class="accordion-inner">';
	if (schema.type === "url") {
		html += '<h5>URL</h5>';
		html += '<p>' + schema.url + '</p>';
	} else if (schema.type === "inline") {
		html += '<h5>Schema</h5>';
		html += createInlineSchema(schema.schema);
	} else {
		html += "<p>Unsupported type " + schema.type + "</p>";
	}
	html += '</div></div></div>';
	return html;
}

function createHeaderSection(headers) {
	var html = '<div class="restdoc-headers" id="headers">';
	html += '<h2 id="headers-anchor">Global headers</h2>';
	html += '<a name="headers-request-anchor"></a>';
	html += createHeaderList('h3', 'Request', headers.request);
	html += '<a name="headers-response-anchor"></a>';
	html += createHeaderList('h3', 'Response', headers.response);	
	html += '</div>';
	return html;
}

function createHeaderList(st, title, headers) {
	var html = '<'+st+'>' + title + '</'+st+'>';
	html += '<ul>';
	var req;
	for (var prop in headers) {
		if (headers.hasOwnProperty(prop)) {
			if (headers[prop].required && headers[prop].required === true) {
				req = '';
			} else {
				req = ' <small><em>(optional)</em></small>';
			}
			html += listItem(prop, headers[prop].description + req);
		}
	}
	html += '</ul>';
	return html;
}

function createResourceSection(data) {
	var html = '<h2 id="resources-anchor">Resources</h2><div class="accordion" id="accordion-res">';
	
	for (var i = 0; i < data.length; i++) {
		html += createResource(data[i]);
	}
	html += '</div>';
	return html;
}

function createResource(res) {
	var desc = res.description ? res.description : 'No description';
	
	var html = '<div class="accordion-group" id="resource-' + res.id + '-anchor">';
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
		if (res.methods.hasOwnProperty(prop)) {
			html += createResourceMethodSection(res.id, prop, res.methods[prop]);
		}
	}
	html += '</div>'; // Method accordion

	html += '</div></div></div>';
	return html;
}

function createResourceParamSection(params) {
	var html = '<div class="restdoc-params well well-small">';
	html += '<ul>';
	for (var prop in params) {
		if (params.hasOwnProperty(prop)) {
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
		var schema = '';
		if (acc.schema) {

			schema = "Schema: <a href=\"#schema-" + schemasByURI[acc.schema] + "-anchor\">" + acc.schema + "</a>";
		}
		html += listItem(acc.type, schema);
	}
	html += '</ul>';
	return html;
}

function createStatusCodes(codes) {
	var html = '<h6>Return codes</h6><ul>';
	for (var code in codes) {
		if (codes.hasOwnProperty(code)) {
			html += listItem(code, codes[code]);
		}
	}
	html += '</ul>';
	return html;
}

function createParamSection(params) {
	var html = '<h2 id="params-anchor">Params</h2>';
	html += '<ul>';
	for (var prop in params) {
		if (params.hasOwnProperty(prop)) {
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
	}
	html += '</ul>';
	return html;
}

function createOauth2Section(oauth2) {
	var html = '<h2 id="oauth2-anchor">Oauth2</h2>';
	html += "<p>" + oauth2.clientaccess + "</p>";
	html += "<h4>Endpoints</h4>";
	html += "<ul>";
	for (var id in oauth2.endpoints) {
		if (oauth2.endpoints.hasOwnProperty(id)) {
			html += "<li><code>" + id + "</code>: " + oauth2.endpoints[id] + "</li>";
		}
	}
	html += "<h4>Grants</h4>";
	html += "<ul>";
	$.each(oauth2.grants, function(i, grant) {
		html += "<li><code>" + grant + "</code></li>";
	});
	html += "</ul>";
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

/**
 * @param file Path to the json file (e.g. test.json or http://domain.de/test.json
 * @param cbBefore function(restdoc) executed before rendering happens (can be undefined)
 * @param contentElement element where the content is inserted (e. g. $("#test"))
 * @param cbAfter function(restdoc) executed after rendering happened (can be undefined)
 */
function render(file, cbBefore, contentElement, cbAfter) {
	$.ajax({
		"url": file,
		"success": function (restdoc) {
			if (typeof cbBefore === "function") {
				cbBefore(restdoc);
			}
			var output = "";
			output += createSchemaSection(restdoc.schemas);
			output += createHeaderSection(restdoc.headers);
			output += createResourceSection(restdoc.resources);
			if (restdoc.params) {
				output += createParamSection(restdoc.params);
			}
			if (restdoc.oauth2) {
				output += createOauth2Section(restdoc.oauth2);
			}
			contentElement.html(output);
			if (typeof cbAfter === "function") {
				cbAfter(restdoc);
			}
		},
		"error": function (e) {
			contentElement.html("Error loading RestDoc: " + e);
		},
		"dataType": "json"
	});
}
