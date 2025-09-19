sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/routing/History"
], function (Controller, JSONModel,History) {
    "use strict";

    return Controller.extend("com.sap.dashboard.db.idocdashboard.controller.Detailview", {
        onInit: function () {
      const oRouter = this.getOwnerComponent().getRouter();
      oRouter.getRoute("Detailview").attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
    //   const oArgs = oEvent.getParameter("arguments");
    //   const status = oArgs.status;
    //   const source = oArgs.source;

     var status = localStorage.getItem("Status"); 
    //  var source = localStorage.getItem("Source"); 



      // Get the selected data model
     const oModel = sap.ui.getCore().getModel("SelectedChartDataModel");

      if (oModel) {
        this.getView().setModel(oModel, "detailModel");
      } else {
        // fallback or error handling
        sap.m.MessageToast.show("No data available for " + status);
      }

      // Optionally set view title or context info
    //   this.getView().byId("page").setTitle(`Details - ${status} (${source})`);
    },

    onNavBack: function () {
      const oHistory = History.getInstance();
      const sPreviousHash = oHistory.getPreviousHash();

      if (sPreviousHash !== undefined) {
        window.history.go(-1);
      } else {
        const oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo("Overview", {}, true);
      }
    }
    });
});