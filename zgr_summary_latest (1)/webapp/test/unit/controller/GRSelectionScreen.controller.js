/*global QUnit*/

sap.ui.define([
	"com/sap/coupang/zgrsummary/controller/GRSelectionScreen.controller"
], function (Controller) {
	"use strict";

	QUnit.module("GRSelectionScreen Controller");

	QUnit.test("I should test the GRSelectionScreen controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
