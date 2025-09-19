sap.ui.define([
  "sap/ui/core/mvc/Controller"
], (BaseController) => {
  "use strict";

  return BaseController.extend("com.sap.coupang.zgrsummary.controller.App", {
      onInit() {
        sap.ui.getCore().applyTheme("sap_belize");
      }
  });
});