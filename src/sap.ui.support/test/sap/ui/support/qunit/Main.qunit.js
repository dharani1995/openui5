/*global QUnit,sinon*/

sap.ui.require([
	"jquery.sap.global",
	"sap/ui/support/supportRules/Main",
	"sap/ui/support/supportRules/WindowCommunicationBus",
	"sap/ui/support/supportRules/WCBChannels",
	"sap/ui/support/supportRules/RuleSet"],
	function (jQuery, Main, CommunicationBus, channelNames, RuleSet) {
		"use strict";

		/*eslint-disable no-unused-vars*/
		var core;
		/*eslint-enable no-unused-vars*/

		var spyChannel = function (channelName) {
			sinon.spy(CommunicationBus, "publish");

			return {
				assertCalled: function (assert) {
					assert.ok(CommunicationBus.publish.calledWith(channelName), "channel name: " + channelName + " should be called");
					CommunicationBus.publish.restore();
				}
			};
		};

		function createValidRule(sRuleId) {
			return {
				id: sRuleId,
				check: function () { },
				title: "title",
				description: "desc",
				resolution: "res",
				audiences: ["Control"],
				categories: ["Performance"],
				selected: true
			};
		}

		function createValidRules(sRuleId, iNumberOfRules) {
			var aRules = [];

			for (var i = 1; i <= iNumberOfRules; i++) {
				aRules.push(createValidRule(sRuleId + i));
			}

			return aRules;
		}

		function createRuleSet(sLibName, sRuleId, iNumberOfRules) {
			var oLib = {
				name: sLibName,
				niceName: "sap library"
			};

			var oRuleSet = new RuleSet(oLib);

			var aRules = createValidRules(sRuleId, iNumberOfRules);
			aRules.forEach(function (oRule) {
				oRuleSet.addRule(oRule);
			});

			return {
				lib: oLib,
				ruleset: oRuleSet
			};
		}

		function createRuleSetObject(sLibName, sRuleId, iNumberOfRules) {
			return {
				name: sLibName,
				niceName: "sap library",
				ruleset: createValidRules(sRuleId, iNumberOfRules)
			};
		}

		Main.startPlugin();

		sap.ui.getCore().registerPlugin({
			startPlugin: function (oCore) {
				core = oCore;
			}
		});

		QUnit.module("Main.js test", {
			setup: function () {
				this.clock = sinon.useFakeTimers();
			},
			teardown: function () {
				this.clock.restore();
			}
		});

		/*
		TODO: Fix the issue with race condition
		Temporary commenting the test to avoid build problems.
		*/
		// QUnit.test("When a library is loaded", function () {
		// 	sinon.spy(Main, "_fetchSupportRuleSets");

		// 	core.fireLibraryChanged({
		// 		stereotype: "library"
		// 	});

		// 	assert.ok(Main._fetchSupportRuleSets.calledOnce, " the support rules should be updated");

		// 	Main._fetchSupportRuleSets.restore();
		// });

		QUnit.test("When a new control is created", function (assert) {
			var spyCoreStateChanged = spyChannel(channelNames.ON_CORE_STATE_CHANGE);

			var icon = new sap.ui.core.Icon();
			this.clock.tick(600);

			spyCoreStateChanged.assertCalled(assert);
			icon.destroy();
		});

		QUnit.test("When a control is deleted", function (assert) {
			var icon = new sap.ui.core.Icon();
			var spyCoreStateChanged = spyChannel(channelNames.ON_CORE_STATE_CHANGE);

			icon.destroy();
			this.clock.tick(600);

			spyCoreStateChanged.assertCalled(assert);
		});

		QUnit.test("Element tree", function (assert) {
			var assertIsDirectChild = function (id1, id2, et) {
				var root = et.constructor === Array ? et[0] : et;

				if (root.id == id2) {
					var isDirectChild = false;
					root.content.forEach(function (content) {
						if (content.id === id1) {
							isDirectChild = true;
						}
					});

					assert.ok(isDirectChild, id1 + " should be direct child of " + id2);
				} else {
					root.content.forEach(function (content) {
						assertIsDirectChild(id1, id2, content);
					});
				}
			};

			var oPanel = new sap.m.Panel({
				id: "rootPanel",
				content: [
					new sap.m.Panel({
						id: "innerPanel1",
						content: [
							new sap.m.Button({
								id: "innerButton"
							}),
							new sap.m.Text({
								id: "innerText"
							})
						]
					}),
					new sap.m.Panel({
						id: "innerPanel2",
						content: [
							new sap.m.Button({
								id: "innerButton2"
							})
						]
					})

				]
			});

			Main.setExecutionScope({
				type: "subtree",
				parentId: "rootPanel"
			});

			var et = Main._createElementTree();

			assertIsDirectChild("rootPanel", "WEBPAGE", et);
			assertIsDirectChild("innerPanel1", "rootPanel", et);
			assertIsDirectChild("innerPanel2", "rootPanel", et);
			assertIsDirectChild("innerButton", "innerPanel1", et);
			assertIsDirectChild("innerText", "innerPanel1", et);
			assertIsDirectChild("innerButton2", "innerPanel2",et);

			oPanel.destroy();
		});

		QUnit.module("Main.js methods", {
			setup: function () {
				// Store _mRuleSets
				this._mRuleSets = jQuery.extend(true, {}, Main._mRuleSets);

				Main._mRuleSets = {
					"temporary": {
					   "lib": {
						  "name": "temporary"
					   },
					   "ruleset": {
						  "_oSettings": {
							 "name": "temporary"
						  },
						  "_mRules": {
							"tmpRule": {
								"id": "tmpRule",
								"libName": "temporary"
							}
						  },
						  "getRules": function () {
							return this._mRules;
						  }
					   }
					},
					"sap.ui.core": {
					   "lib": {
						  "name": "sap.ui.core",
						  "niceName": "UI5 Core Library"
					   },
					   "ruleset": {
						  "_oSettings": {
							 "name": "sap.ui.core",
							 "niceName": "UI5 Core Library"
						  },
						  "_mRules": {
							"preloadAsyncCheck": {
								"id": "preloadAsyncCheck",
								"libName": "sap.ui.core"
							},
							 "cacheBusterToken": {
								"id": "cacheBusterToken",
								"libName": "sap.ui.core"
							 },
							 "unresolvedPropertyBindings": {
								"id": "unresolvedPropertyBindings",
								"libName": "sap.ui.core"
							 },
							 "bindingPathSyntaxValidation": {
								"id": "bindingPathSyntaxValidation",
								"libName": "sap.ui.core"
							 },
							 "XMLViewWrongNamespace": {
								"id": "XMLViewWrongNamespace",
								"libName": "sap.ui.core"
							 },
							 "XMLViewDefaultNamespace": {
								"id": "XMLViewDefaultNamespace",
								"libName": "sap.ui.core"
							 }
						  },
						  "getRules": function () {
							return this._mRules;
						  }
					   }
					},
					"sap.m": {
					   "lib": {
						  "name": "sap.m",
						  "niceName": "UI5 Main Library"
					   },
					   "ruleset": {
						  "_oSettings": {
							 "name": "sap.m",
							 "niceName": "UI5 Main Library"
						  },
						  "_mRules":{
							 "onlyIconButtonNeedsTooltip": {
								"id": "onlyIconButtonNeedsTooltip",
								"libName": "sap.m"
							 },
							 "dialogarialabelledby": {
								"id": "dialogarialabelledby",
								"libName": "sap.m"
							 },
							 "inputNeedsLabel": {
								"id": "inputNeedsLabel",
								"libName": "sap.m"
							 }
						  },
						  "getRules": function () {
							return this._mRules;
						  }
					   }
					}
				};
			},
			teardown: function () {
				// Restore _mRuleSets
				Main._mRuleSets = jQuery.extend(true, {}, this._mRuleSets);
				this._mRuleSets = null;
				RuleSet.clearAllRuleSets();
				Main._aSelectedRules = [];
				Main._oSelectedRulesIds = {};
			}
		});

		QUnit.test("_setSelectedRules with a single ruleDescriptor object", function (assert) {
			// Arrange
			var oRuleDescriptor = {
				"libName": "sap.m",
				"ruleId": "onlyIconButtonNeedsTooltip"
			};

			// Act
			Main._setSelectedRules(oRuleDescriptor);

			// Assert
			assert.equal(Main._aSelectedRules.length, 1, "Should have only one selected rule in _aSelectedRules");
			assert.equal(Object.keys(Main._oSelectedRulesIds).length, 1, "Should have only one selected rule in _oSelectedRulesIds");
			assert.equal(Main._oSelectedRulesIds[oRuleDescriptor.ruleId], true, "Should have the id of the selected rule");
		});

		QUnit.test("_setSelectedRules with multiple ruleDescriptors", function (assert) {
			// Arrange
			var aRuleDescriptors = [
				{
					"ruleId": "tmpRule",
					"libName": "temporary"
				},
				{
					"ruleId": "preloadAsyncCheck",
					"libName": "sap.ui.core"
				},
				{
					"ruleId": "XMLViewWrongNamespace",
					"libName": "sap.ui.core"
				},
				{
					"ruleId": "inputNeedsLabel",
					"libName": "sap.m"
				}
			];

			// Act
			Main._setSelectedRules(aRuleDescriptors);

			// Assert
			assert.equal(Main._aSelectedRules.length, 4, "Should have 4 selected rules in _aSelectedRules");
			assert.equal(Object.keys(Main._oSelectedRulesIds).length, 4, "Should have 4 selected rules in _oSelectedRulesIds");
		});

		QUnit.test("_setSelectedRules with no ruleDescriptors", function (assert) {
			// Arrange
			var iTotalRules = 0;
			Object.keys(Main._mRuleSets).map(function (sLibName) {
				var oRulesetRules = Main._mRuleSets[sLibName].ruleset.getRules();
				iTotalRules += Object.keys(oRulesetRules).length;
			});

			// Act
			Main._setSelectedRules();

			// Assert
			assert.equal(Main._aSelectedRules.length, iTotalRules, "Should have all rules as selected in _aSelectedRules");
			assert.equal(Object.keys(Main._oSelectedRulesIds).length, iTotalRules, "Should have all rules as selected in _oSelectedRulesIds");
		});

		QUnit.test("_fetchRuleSet with ruleset of type RuleSet and library not present in the available rulesets", function (assert) {
			// Arrange
			sinon.stub(jQuery.sap, "getObject", function (sLibName) {
				return {
					library: {
						support: createRuleSet("sap.uxap", "validRule", 1)
					}
				};
			});

			// Act
			Main._fetchRuleSet("sap.uxap");

			//Assert
			assert.ok(Main._mRuleSets["sap.uxap"].ruleset instanceof RuleSet, "Should be an instance of RuleSet");
			assert.equal(Object.keys(Main._mRuleSets["sap.uxap"].ruleset._mRules).length, 1, "Should have one fetched rule");

			jQuery.sap.getObject.restore();
		});

		QUnit.test("_fetchRuleSet with ruleset of type RuleSet and library present in the available rulesets", function (assert) {
			// Arrange
			sinon.stub(jQuery.sap, "getObject", function (sLibName) {
				return {
					library: {
						support: createRuleSet("sap.uxap", "anotherValidRule", 2)
					}
				};
			});

			// Setup initial RuleSet
			Main._mRuleSets["sap.uxap"] = createRuleSet("sap.uxap", "initialValidRule", 2);

			// Act
			Main._fetchRuleSet("sap.uxap");

			//Assert
			assert.ok(Main._mRuleSets["sap.uxap"].ruleset instanceof RuleSet, "Should be an instance of RuleSet");
			assert.equal(Object.keys(Main._mRuleSets["sap.uxap"].ruleset._mRules).length, 4, "Should have four fetched rules");

			jQuery.sap.getObject.restore();
		});

		QUnit.test("_fetchRuleSet with ruleset of type Object and library not present in the available rulesets", function (assert) {
			// Arrange
			sinon.stub(jQuery.sap, "getObject", function (sLibName) {
				return {
					library: {
						support: createRuleSetObject("sap.uxap", "validRule", 3)
					}
				};
			});

			// Act
			Main._fetchRuleSet("sap.uxap");

			//Assert
			assert.ok(Main._mRuleSets["sap.uxap"].ruleset instanceof RuleSet, "Should be an instance of RuleSet");
			assert.equal(Object.keys(Main._mRuleSets["sap.uxap"].ruleset._mRules).length, 3, "Should have three fetched rules");

			jQuery.sap.getObject.restore();
		});

		QUnit.test("_fetchRuleSet join two types of rulesets", function (assert) {
			// Arrange
			sinon.stub(jQuery.sap, "getObject", function (sLibName) {
				var oRuleSet = createRuleSetObject("sap.uxap", "validRule", 2);

				// Test if a ruleset with nested arrays of rules joins them correctly
				// ruleset: [
				// 	rule1,
				// 	rule2,
				// 	[
				// 		rule3,
				// 		rule4
				// 	],
				// 	rule5,
				// 	rule6
				// ]
				oRuleSet.ruleset.push(createValidRules("additionalRule", 2));
				oRuleSet.ruleset.push(createValidRule("additionalRule_5"));
				oRuleSet.ruleset.push(createValidRule("additionalRule_6"));

				return {
					library: {
						support: oRuleSet
					}
				};
			});

			// Setup initial RuleSet
			Main._mRuleSets["sap.uxap"] = createRuleSet("sap.uxap", "initialValidRule", 2);

			// Act
			Main._fetchRuleSet("sap.uxap");

			//Assert
			assert.ok(Main._mRuleSets["sap.uxap"].ruleset instanceof RuleSet, "Should be an instance of RuleSet");
			assert.equal(Object.keys(Main._mRuleSets["sap.uxap"].ruleset._mRules).length, 8, "Should have eight fetched rules");

			jQuery.sap.getObject.restore();
		});

		QUnit.test("_fetchRuleSet with unknown library", function (assert) {
			// Arrange
			sinon.stub(jQuery.sap, "getObject", function (sLibName) {
				return;
			});
			sinon.spy(jQuery.sap.log, "error");

			// Act
			Main._fetchRuleSet("sap.test");

			//Assert
			assert.notOk(Main._mRuleSets["sap.test"], "Should be undefined");
			assert.equal(jQuery.sap.log.error.callCount, 1, "should have logged an error");

			jQuery.sap.getObject.restore();
			jQuery.sap.log.error.restore();
		});
});