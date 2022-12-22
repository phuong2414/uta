require([
	'text!plugins/template/survey.html'
], function(template) {
	if (drcom.isPhantom) return;

	var QuestionQuery = function() {
		this.init.apply(this, arguments);
	};

	QuestionQuery.prototype = {
		recordTypes: {
			"012K00000008nF1IAI": "Picklist",
			"012K00000008nF3IAI": "Text",
			"012K00000008nF2IAI": "Radio",
			"012K00000008nEzIAI": "Multiselect",
			"012K00000008nF0IAI": "Number",
			"012K00000008nEyIAI": "Long Text",
			"012K00000008nEvIAI": "Date",
			"012K00000008nEwIAI": "Datetime",
			"012K00000008nExIAI": "Description"
		},

		fields: [
			"Text_vod__c",
			"Answer_Choice_vod__c",
			"Order_vod__c",
			"RecordTypeId",
			"Required_vod__c"
		],

		name: 'Survey_Question_vod__c',

		clm: com.veeva.clm,

		init: function(questionObj, callback) {
			this.returnData = questionObj;
			this.callback = callback;
		},

		initQueues: function() {
			var queues = [];
			_.each(this.returnData, function(obj) {
				queues.push(obj.ID);
			}, this);
			this.queues = queues;
		},

		start: function() {
			this.initQueues();
			this._next();
		},

		_next: function() {
			this.count = 0;
			if (this.queues.length) {
				this.currentId = this.queues.pop();
				this._query();
			} else {
				if (this.callback) this.callback(this.returnData);
			}
		},

		_checkQuery: function() {
			this.count++;
			if (this.count >= this.fields.length) {
				this._next();
			} else {
				this._query();
			}
		},

		_query: function() {
			var handler = $.proxy(this._queryCallback, this),
				field = this.fields[this.count];
			this.clm.getDataForObject(this.name, this.currentId, field, handler);
		},

		_queryCallback: function(result) {
			var field = this.fields[this.count],
				index = this._findCurrentObjIndex(),
				currObj = index >= 0 ? this.returnData[index] : {},
				fieldVal = result[this.name][field];
			if (field == "RecordTypeId") {
				var recordValue = this.recordTypes[fieldVal] || "";
				currObj.RecordTypeName = recordValue;
				currObj.RecordTypeId = fieldVal;
			} else {
				currObj[field] = fieldVal;
			}
			
			this._checkQuery();
		},

		_findCurrentObjIndex: function() {
			var index = -1,
				id = this.currentId;
			_.each(this.returnData, function(obj, i) {
				if (obj.ID == id) {
					index = i;
				}
			});

			return index;
		},
	};

	var QuestionResponseQuery = function() {
		this.init.apply(this, arguments);
	};

	QuestionResponseQuery.prototype = {
		fields: [
			"Survey_Question_vod__c",
			"Response_vod__c"
		],

		name: 'Question_Response_vod__c',

		clm: com.veeva.clm,

		init: function(responses, updateCallback, completeCallback) {
			this.initQueues(responses);
			this.updateCallback = updateCallback;
			this.completeCallback = completeCallback;
		},

		initQueues: function(responses) {
			var queues = [];
			_.each(responses, function(resp) {
				queues.push(resp.ID);
			});
			this.queues = queues;
		},

		start: function() {
			this._next();
		},

		_next: function() {
			this.count = 0;
			if (this.queues.length) {
				this.currentId = this.queues.pop();
				this.updateResult = {
					ResponseID: this.currentId
				}

				this._query();
			} else {
				if (this.completeCallback) this.completeCallback();
			}
		},

		_checkQuery: function() {
			this.count++;
			if (this.count >= this.fields.length) {
				if (this.updateCallback) this.updateCallback(this.updateResult);
				this._next();
			} else {
				this._query();
			}
		},

		_query: function() {
			var handler = $.proxy(this._queryCallback, this),
				field = this.fields[this.count];
			this.clm.getDataForObject(this.name, this.currentId, field, handler);
		},

		_queryCallback: function(result) {
			if (result.success) {
				var field = this.fields[this.count];
					value = result.Question_Response_vod__c[field];
				this.updateResult[field] = value;
			}
			this._checkQuery();
		}
	};

	var RecordTypeQuery = function() {
		this.init.apply(this, arguments);
	};

	RecordTypeQuery.prototype = {
		clm: com.veeva.clm,

		init: function(objName, callback) {
			this.objName = objName;
			this.count = 0;
			this.callback = callback;
			this.recordList = null;
			this.types = [];

			this.clm.getRecordType_Object(this.objName, $.proxy(this.onGetRecordList, this));
		},

		queryForEachRecord: function() {
			var id = this.recordList[this.count].ID;
			this.clm.getDataForObject('RecordType', id, 'Name', $.proxy(this.onEachSuccess, this));
		},

		onGetRecordList: function(result) {
			if (result.success) {
				this.recordList = result.RecordType;
				this.queryForEachRecord();
				this.clm.getDataForObject('RecordType', this.recordList[0].ID, 'Name', $.proxy(this.onEachRecordTypeSuccess, this));
			} else {
				console.log('Failed to get record list for ' + this.objName);
			}
		},

		onEachSuccess: function(result) {
			this.types.push({
				name: result.RecordType.Name,
				id: this.recordList[this.count].ID
			});

			this.count++;
			if (this.count >= this.recordList.length) {
				if (this.callback) this.callback(this.types);
			} else {
				this.queryForEachRecord();
			}
		}
	};

	var SubmitQueue = function() {
		this.init.apply(this, arguments);
	};

	SubmitQueue.prototype = {
		clm: com.veeva.clm,

		name: 'Question_Response_vod__c',

		init: function(target, callback) {
			this.queues = [];
			this.surveyTarget = target;
			this.callback = callback;
		},

		add: function(data, id) {
			this.queues.push({data: data, updateId: id});
		},

		submit: function() {
			if (this.queues.length) {
				this._doSubmit();
			} else {
				if (this.callback) this.callback({message: 'Nothing to submit.'});
			}
		},

		update: function() {
			if (this.queues.length) {
				this._doUpdate();
			} else {
				if (this.callback) this.callback({message: 'Nothing to update.'});
			}
		},

		_doSubmit: function() {
			var currObj = this.queues.pop(),
				handler = $.proxy(this.onCreateRecordSuccess, this);
			this.clm.createRecord(this.name, currObj.data, handler);
		},

		_doUpdate: function() {
			var currObj = this.queues.pop(),
				handler = $.proxy(this.onUpdateRecordSuccess, this);
			this.clm.updateRecord(this.name, currObj.updateId, currObj.data, handler);
		},

		_updateSurveyTarget: function() {
			var callback = this.callback,
				values = {Status_vod__c: 'Submitted_vod'};
			this.clm.updateRecord("Survey_Target_vod__c", this.surveyTarget, values, function(result) {
				if (callback) callback({message: 'All answers has been submitted.'});
			});
		},

		onCreateRecordSuccess: function(result) {
			if (this.queues.length) {
				this._doSubmit();
			} else {
				this._updateSurveyTarget();
			}
		},

		onUpdateRecordSuccess: function(result) {
			if (this.queues.length) {
				this._doUpdate();
			} else {
				this._updateSurveyTarget();
			}
		},
	};

	Drcom.Survey = Drcom.Controller.extend({
		pluginName: "drcom_survey",

		surveyId: null, 
		accountId: null,
		surveyTarget: null,

		questionObj: null,
		qsRecordTypes: null,

		clm: com.veeva.clm,

		init: function(el, options) {
			this.super.init.apply(this, [el, options]);
			drcom.waitForPlayer($.proxy(this.initSurvey, this));
		},

		initSurvey: function() {
			this.clm.getDataForCurrentObject("Presentation", "Survey_vod__c", $.proxy(this.onGetSurveyIdSuccess, this));

			if ($('.controls-bar', this.element).length) {
				this._bindControlEvents();
			}
		},

		/* CALLBACKs */
		onGetSurveyIdSuccess: function(result) {
			if (result.success) {
				this.surveyId = result.Presentation.Survey_vod__c;
				this.clm.getDataForCurrentObject("Account", "ID", $.proxy(this.onGetAccountSuccess, this));
			} else {
				console.log('Failed to get survey ID');
			}
		},

		onGetAccountSuccess: function(result) {
			if (result.success) {
				this.accountId = result.Account.ID;
				this.clm.getSurveyTarget_Account(this.accountId, this.surveyId, $.proxy(this.onGetSurveyTargetSuccess, this));
			} else {
				console.log('Failed to get account ID');
			}
		},

		onGetSurveyTargetSuccess: function(result) {
			if (result.success) {
				this.surveyTarget = result.Survey_Target_vod__c[0].ID;
				this.clm.getSurveyQuestions_Survey(this.surveyId, $.proxy(this.onGetSurveyQuestionsSuccess, this));
			} else {
				console.log('Failed to get survey targets');
			}
		},

		onGetSurveyQuestionsSuccess: function(result) {
			var r = result.Survey_Question_vod__c;
			if (r && r.length) {
				var handler = $.proxy(this.onQuestionQueryCompleted, this);
				new QuestionQuery(r, handler).start();
			} else {
				console.log('No questions!');
			}
		},

		onQuestionQueryCompleted: function(result) {
			this.questionObj = result;
			this.clm.getQuestionResponse_SurveyTarget(this.surveyTarget, $.proxy(this.onGetQuestionResponseSuccess, this));
		},

		onGetQuestionResponseSuccess: function(result) {
			if (result.success) {
				this.responses = result.Question_Response_vod__c;

				var completeCallback = $.proxy(this.onQuestionResponseCompleted, this);
				if (this.responses.length) {
					var updateCallback = $.proxy(this.onEachQuestionResponseQuerySuccess, this);
					new QuestionResponseQuery(this.responses, updateCallback, completeCallback).start();
				} else {
					completeCallback();
				}
			}
		},

		onEachQuestionResponseQuerySuccess: function(result) {
			var id = result.Survey_Question_vod__c,
				responseId = result.ResponseID,
				value = result.Response_vod__c;
			this._updateResponseForQuestionObj(id, value);
			this._updateIdForResponse(responseId, id);
		},

		onQuestionResponseCompleted: function() {
			this._renderQuestion();

			var handler = $.proxy(this.onGetRecordTypesSuccess, this);
			new RecordTypeQuery('Question_Response_vod__c', handler);
		},

		onGetRecordTypesSuccess: function(result) {
			this.qsRecordTypes = result;
		},

		onNext: function() {
			if (this.questionIndex < this.total - 1) {
				this.questionIndex++;
				this._translate();
			}
		},

		onPrev: function() {
			if (this.questionIndex > 0) {
				this.questionIndex--;
				this._translate();
			}
		},

		onSubmit: function() {
			if (!this.hasSubmitted) {
				this.hasSubmitted = true;

				this.answers = this._getAnswers();
				this.clm.getDataForObject('Survey_Target_vod__c', this.surveyTarget, 'Status_vod__c', $.proxy(this.onGetStatusSuccess, this));
			}
		},

		onReload: function() {
			this._resetAnswers();
			this.questionIndex = 0;
			this._translate();
		},

		onGetStatusSuccess: function(result) {
			if (result.success) {
				var status = result.Survey_Target_vod__c.Status_vod__c;
				if (status === "Pending_vod") {
					this._createSubmit();
				} else if (status === "Saved_vod" || status === "Submitted_vod") {
					this._updateSubmit();
				}
			}
		},

		/* HELPERS */
		_createSubmit: function() {
			var callback = $.proxy(this._submitCompleteCallback, this),
				submitQueue = new SubmitQueue(this.surveyTarget, callback);

			_.each(this.answers, function(ans) {
				submitQueue.add(this._submitObj(ans));
			}, this);

			// start submit all answers
			submitQueue.submit();
		},

		_updateSubmit: function() {
			var callback = $.proxy(this._updateSubmitCallback, this),
				submitQueue = new SubmitQueue(this.surveyTarget, callback);

			_.each(this.responses, function(obj) {
				var id = obj.Survey_Question_vod__c,
					ans = this._answerObjFromId(id);
				submitQueue.add(this._submitObj(ans), obj.ID);
			}, this);

			// update all answers
			submitQueue.update();
		},

		_updateSubmitCallback: function(result) {
			// after update, we need to check if there a new question added
			// then we have to call create submit
			// filter new questions
			var callback = $.proxy(this._submitCompleteCallback, this),
				submitQueue = new SubmitQueue(this.surveyTarget, callback),
				hasNew = false;
			_.each(this.answers, function(ans) {
				if (this._isNewQuestion(ans.id)) {
					hasNew = true;
					submitQueue.add(this._submitObj(ans));
				}
			}, this);

			if (hasNew) submitQueue.submit();
			else callback();
		},

		_submitCompleteCallback: function() {
			//alert('All answers have been submitted. Please sync to save your choices!!!');
			var root = drcom.config.survey.rootAsset;
			if (root) {
				if (drcom.isMultiFlow) drcom.gotoPresentation(root.slideId, root.presentationId);
				else drcom.gotoSlide(root.slideId);
			}

			$.event.trigger('surveysubmitted');
		},

		_submitObj: function(ans) {
			var qObj = this._quesionObjFromId(ans.id),
				qTypeId = this._CLMRecordType();
			
			return {
				Survey_Target_vod__c: this.surveyTarget,
				Survey_Question_vod__c: ans.id,
				Answer_Choice_vod__c: qObj.Answer_Choice_vod__c,
				Response_vod__c: ans.answer,
				Question_Text_vod__c: ans.text,
				Required_vod__c: qObj.Required_vod__c ? 1 : 0,
				Order_vod__c: qObj.Order_vod__c,
				RecordTypeId: qTypeId,
				Type_vod__c: qObj.RecordTypeId
			};
		},

		_getAnswers: function() {
			var answers = [];
			$('.survey-question').each(function() {
				var el = $(this),
					choiceEl = $('.question-choices', el),
					id = el.attr('id'),
					type = el.attr('type'),
					text = $('.question-text', el).text(),
					answer = "";
				if (type === "Picklist") {
					answer = choiceEl.find('select').val();
				} else if (type === "Text" || type === "Number" || type === "Long Text") {
					answer = choiceEl.find('input,textarea').val();
				} else if (type === "Radio") {
					var checked = choiceEl.find('input:checked');
					if (checked.length) answer = checked.val();
				} else if (type === "Multiselect") {
					var vals = [];
					choiceEl.find('input:checked').each(function() {
						vals.push($(this).val());
					});
					answer = vals.join(';');
				}

				answers.push({
					id: id,
					text: text,
					answer: answer
				});
			});

			return answers;
		},

		_resetAnswers: function() {
			$('.survey-question').each(function() {
				var el = $(this),
					choiceEl = $('.question-choices', el),
					type = el.attr('type');
				if (type === "Picklist") {
					choiceEl.find('select').prop('selectedIndex', 0);
				} else if (type === "Text" || type === "Number" || type === "Long Text") {
					choiceEl.find('input,textarea').val("");
				} else if (type === "Radio" || type === "Multiselect") {
					choiceEl.find('input').removeAttr('checked');
				}
			});
		},

		_answerObjFromId: function(id, answers) {
			return _.find(this.answers, function(obj) {
				return obj.id == id;
			});
		},

		_quesionObjFromId: function(id) {
			return _.find(this.questionObj, function(obj) {
				return obj.ID == id;
			});
		},

		_isNewQuestion: function(id) {
			var found = _.find(this.responses, function(resp) {
				return resp.Survey_Question_vod__c == id;
			});

			if (found) return false;
			return true;
		},

		_updateResponseForQuestionObj: function(id, value) {
			_.each(this.questionObj, function(obj, i) {
				if (obj.ID == id) {
					this.questionObj[i].Response_vod__c = value;
				}
			}, this);
		},

		_updateIdForResponse: function(responseId, qsId) {
			_.each(this.responses, function(obj, i) {
				if (obj.ID == responseId) {
					this.responses[i].Survey_Question_vod__c = qsId;
				}
			}, this);
		},

		_CLMRecordType: function() {
			var foundObj = _.find(this.qsRecordTypes, function(obj) {
				return obj.name == "CLM";
			});
			if (foundObj) return foundObj.id;

			return false;
		},

		_translate: function() {
			var translateX = -(this.questionIndex*this.questionWidth);
			$('.question-list-content').css('-webkit-transform', 'translate3d(' + translateX + 'px, 0, 0)');

			var next = $('.controls-bar span.control-next'),
				submit = $('.controls-bar span.control-submit');
			if (this.questionIndex == this.total - 1) {
				next.hide();
				submit.show();
			} else {
				next.show();
				submit.hide();
			}
		},

		_renderQuestion: function() {
			var tmp = this.options.template || template;
			this.element.empty().append(_.template(tmp)({
				questionObj: this.questionObj
			}));

			setTimeout($.proxy(this._bindControlEvents, this), 0);
		},

		_bindControlEvents: function() {
			var container = $('.question-list'),
				prev = $('.controls-bar span.control-prev'),
				next = $('.controls-bar span.control-next'),
				submit = $('.controls-bar span.control-submit'),
				reload = $('.controls-bar .control-reload');

			this.questionWidth = $('.survey-question').outerWidth();
			this.questionIndex = 0;
			this.total = $('.survey-question', container).length;
			container.width(this.questionWidth*this.total);

			next.bind('tapone', $.proxy(this.onNext, this));
			prev.bind('tapone', $.proxy(this.onPrev, this));
			submit.bind('tapone', $.proxy(this.onSubmit, this));
			reload.bind('tapone', $.proxy(this.onReload, this));
		}
	});

	$.fn.drcom_survey = function (options) {
		$(this).each(function () {
			new Drcom.Survey($(this), options);
		});
		return $(this);
	};

	var conf = drcom.config.survey;
	if (conf && conf.isShow) {
		var survey = $('#survey');
		if (!survey.length) 
			survey = $('<div id="survey"></div>').appendTo('#container');

		if (conf.customTemplate) {
            var path = 'text!' + conf.customTemplate;
            require([path], function(customTemplate) {
            	drcom.survey = survey.drcom_survey({
                    template: customTemplate
                }).controller();
            });
        } else drcom.survey = survey.drcom_survey().controller();
	}
});