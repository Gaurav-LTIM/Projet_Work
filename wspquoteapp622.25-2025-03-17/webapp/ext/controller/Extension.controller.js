sap.ui.controller("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25.ext.controller.Extension", {

    onInit: function () {

        // Call the base controller's onInit method
        if (sap.ui.core.mvc.Controller.prototype.onInit) {
            sap.ui.core.mvc.Controller.prototype.onInit.apply(this, arguments);
        }

        // var oModel = this.getOwnerComponent().getModel();
        // oModel.attachEvent("requestCompleted", this._onDataLoaded, this);

        var oExtensionAPI = this.extensionAPI;
        if (oExtensionAPI) {
            oExtensionAPI.attachPageDataLoaded(this.onPageDataLoaded.bind(this));
        }

        this.oTable = null;
        this._oLink = null;
        this.oDomRef = null;
        this.sLink = null;
        this._oButtonPressHandler = null;

    },

    onSalesQuotationPress: function (oEvent) {
        var sQuotationID = oEvent.getSource().getText();
        var sUrl = `https://sapwdpdev3.corp.yw.kelda:44321/sap/bc/ui2/flp/FioriLaunchpad.html#SalesQuotation-display?SalesQuotation=${sQuotationID}`;
        window.open(sUrl, "_blank");
    },

    // _onDataLoaded: function (oEvent) {

    //     var sUrl = oEvent.getParameter("url");
    //     this._sUrl = sUrl; // Store the URL parameter in a variable
    //     // oModel.detachEvent("requestCompleted", this._onDataLoaded, this);

    // },

    
    onPageDataLoaded: function () {

        // var sUrl = this._sUrl;
        var sUrl = window.location.href;

        // if (sUrl && sUrl.includes("ZCDS_SSC_C_622_INFRA_25")) { // Adjust the entity set name as needed
        //     this._waitForWasteFieldValue().then(this._initializeButton.bind(this));
        //     // oModel.detachEvent("requestCompleted", this._onDataLoaded, this);
        // }
        if (sUrl && sUrl.includes("to_Infra")) { // Adjust the entity set name as needed
            this._waitForWasteFieldValue().then(this._initializeButton.bind(this));
            // oModel.detachEvent("requestCompleted", this._onDataLoaded, this);
            var oInput1 = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--InfraCredits_FieldGroup::InfBrwAddToWaste::Field-comboBoxEdit-inner");
            var oInput2 = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--InfraCredits_FieldGroup::CreditMtrSize::Field-comboBoxEdit-inner");

            oInput1.attachChange(this.onInputChange, this);
            oInput2.attachChange(this.onInputChange, this);
        }
        else if (sUrl && sUrl.includes("ZCDS_SSC_C_622_PRJ_HDR_25")) {


            //Setting link to Quote/Inquiry Field
            // this._waitForQuoteFieldValue().then(this._setHyperLink.bind(this));

            // oModel.detachEvent("requestCompleted", this._onDataLoaded, this);

            // });


        }

    },


    _waitForWasteFieldValue: function () {
        return new Promise(function (resolve) {
            var checkWasteFieldValue = function () {
                var oWasteField = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--InfraCal_FieldGroupYN::InfFNFAddToWaste::Field");
                if (oWasteField) {
                    var sWasteFieldValue = oWasteField.getValue();
                    if (sWasteFieldValue || sWasteFieldValue === "") {
                        resolve(sWasteFieldValue);
                    } else {
                        setTimeout(checkWasteFieldValue, 1000); // Adjust the delay as needed
                    }
                }
            }.bind(this);
            checkWasteFieldValue();
        }.bind(this));
    },

    _waitForQuoteFieldValue: function () {
        return new Promise(function (resolve) {
            var checkQuoteFieldValue = function () {
                // var oQuoteField = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_PRJ_HDR_25--Project_FieldGroup::ProjQuotePriceYear::Field");
                var oQuoteField = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_PRJ_HDR_25--Project_FieldGroup::SalesQuotation::Field");
                if (oQuoteField) {
                    var sQuoteFieldValue = oQuoteField.getValue();
                    if (sQuoteFieldValue || sQuoteFieldValue === "") {
                        resolve(sQuoteFieldValue);
                    } else {
                        setTimeout(checkQuoteFieldValue, 1000); // Adjust the delay as needed
                    }
                }
            }.bind(this);
            checkQuoteFieldValue();
        }.bind(this));
    },


    _setHyperLink: function () {

        var oQuoteField = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_PRJ_HDR_25--Project_FieldGroup::SalesQuotation::Field");
        if (oQuoteField) {
            var sQuoteFieldValue = oQuoteField.getValue();

            // Get the DOM reference of the field's parent element
            var oDomRef = oQuoteField.getDomRef();
            if (this._oLink) {
                this._oLink.destroy();
                this._oLink = null;
            }

            if (sQuoteFieldValue === "") {

                // Create a new Link control if it doesn't exist

                console.log("Creating new link control");
                this._oLink = new sap.m.Link({
                    text: "–",
                    enabled: false
                });


                if (!this.oDomRef) {
                    console.log("Manipulating DOM");
                    oDomRef = oDomRef.parentElement;
                    this.oDomRef = oDomRef;

                    // Remove the existing field's DOM element
                    this.oDomRef.removeChild(oQuoteField.getDomRef());

                    // Render the Link control and append it to the parent element
                    this._oLink.placeAt(this.oDomRef);
                }
                else {
                    // if (this.oDomRef === oDomRef.parentElement) {
                    //     oDomRef = oDomRef.parentElement;
                    //     oDomRef.removeChild(oQuoteField.getDomRef());
                    //     this._oLink.placeAt(this.oDomRef);
                    // }
                    this._oLink.placeAt(this.oDomRef);
                }

            }
            else {

                // var sLink = "https://sapwdpdev3.corp.yw.kelda:44321/sap/bc/ui2/flp/FioriLaunchpad.html#SalesQuotation-display?SalesQuotation=" + sQuoteFieldValue;

                // Get the current hostname and protocol
                var sHostname = window.location.hostname;
                var sProtocol = window.location.protocol;

                // Construct the dynamic URL
                var sLink = sProtocol + "//" + sHostname + "/sap/bc/ui2/flp/FioriLaunchpad.html#SalesQuotation-display?SalesQuotation=" + sQuoteFieldValue;

                this.sLink = sLink;

                // Create a new Link control if it doesn't exist
                console.log("Creating new link control");
                this._oLink = new sap.m.Link({
                    text: sQuoteFieldValue,
                    press: function () {
                        console.log("Link pressed");
                        sap.m.URLHelper.redirect(this.sLink, true);
                    }.bind(this)
                });


                if (!this.oDomRef) {

                    console.log("Manipulating DOM");
                    oDomRef = oDomRef.parentElement;
                    this.oDomRef = oDomRef;

                    // Remove the existing field's DOM element
                    this.oDomRef.removeChild(oQuoteField.getDomRef());

                    // Render the Link control and append it to the parent element
                    this._oLink.placeAt(this.oDomRef);
                }
                else {
                    // if (this.oDomRef === oDomRef.parentElement) {
                    //     oDomRef = oDomRef.parentElement;
                    //     oDomRef.removeChild(oQuoteField.getDomRef());
                    //     this._oLink.placeAt(this.oDomRef);
                    // }
                    this._oLink.placeAt(this.oDomRef);
                }

            }
        }

    },

    _initializeButton: function () {
        var oButton = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--FittingandFixture::action::ZCDS_SSC_C_622_PRJ_HDR_25_CDS.ZCDS_SSC_C_622_PRJ_HDR_25_CDS_Entities::ZCDS_SSC_C_622_PRJ_FNF_25Clear_fnf");
        if (oButton) {
            // Detach any existing press event handlers
            if (this._oButtonPressHandler) {
                oButton.detachPress(this._oButtonPressHandler);
                console.log("Detached existing press event handler");
            }

            // attach click listener to F&F Button
            this._oButtonPressHandler = this.onButtonPress.bind(this);
            oButton.attachPress(this._oButtonPressHandler);

            // Initially setting the button text
            this._updateButtonText();
        }
    },

    _updateButtonText: function () {
        var oWasteField = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--InfraCal_FieldGroupYN::InfFNFAddToWaste::Field");
        var oButton = this.byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--FittingandFixture::action::ZCDS_SSC_C_622_PRJ_HDR_25_CDS.ZCDS_SSC_C_622_PRJ_HDR_25_CDS_Entities::ZCDS_SSC_C_622_PRJ_FNF_25Clear_fnf");
        var sWasteFieldValue = oWasteField.getValue();
        if (sWasteFieldValue) {
            oButton.setText("Disable F&F");
        } else {
            oButton.setText("Enable F&F");
        }
    },

    onBeforeSemanticObjectLinkNavigation: function (oEvent) {
        // Get the default URL that would be navigated to
        var sHref = oEvent.getParameter("href");
        if (sHref) {
            window.open(sHref, "_blank"); // Open in a new tab/window
            oEvent.preventDefault();        // Prevent the default same-window navigation
        }
    },

    onBeforeRebindTableExtension: function (e) {

        //Fetching the Cost Table 
        if (e.getSource().getId() === "com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_PRJ_HDR_25--ProjectCost_LineItemRef::Table") {
            // Setting the Cost Table for 500 rows and no selections possible 
            e.getSource().getTable().setMode("None");
            e.getSource().getTable().setGrowingThreshold(500);
            e.getSource().setUseExportToExcel(true);
        }

        //Fetching the FNF Table 
        if (e.getSource().getId() === "com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--FittingandFixture::Table") {

            // Setting the FNF Table for 15 rows and no selections possible 
            e.getSource().getTable().setMode("None");
            e.getSource().getTable().setGrowingThreshold(15);
            e.getSource().setUseExportToExcel(false);

            var oTable = e.getSource().getTable();

            this.oTable = oTable;

            // Hide cell 2 & 3 of the 14th row of FNF Table 
            oTable.attachEvent("updateFinished", () => {
                var aItems = oTable.getItems();
                if (aItems.length > 0) {
                    var aCells = aItems[13].getCells();
                    aCells[1].setVisible(false); // Clear the text in the 2nd column
                    aCells[2].setVisible(false); // Clear the text in the 3rd column
                }
            });

        }

        if (e.getSource().getId() === "com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_PRJ_HDR_25--CpyProj_LineItemRef::Table") {
            var oTable = e.getSource().getTable();

            this.oTable = oTable;

            // Hide cell 2 & 3 of the 14th row of FNF Table 
            oTable.attachEvent("updateFinished", () => {
                var aItems = oTable.getItems();
                if (aItems.length > 0) {
                    aItems.forEach(oItem => {

                        // Check if the item has already been processed
                        if (oItem.data("processed")) {
                            return;
                        }

                        var aCells = oItem.getCells();
                        var oFifthColumnCell = aCells[4];

                        // Get the display aggregation
                        var oDisplayControl = oFifthColumnCell.getAggregation("display");

                        // Fetch the title from the display aggregation
                        var oFifthColumnData = oDisplayControl.getProperty("title");

                        // Remove the original smarttoggle element
                        oFifthColumnCell.destroy();

                        // Create a sap.m.Link control
                        var oLink = new sap.m.Link({
                            text: oFifthColumnData, // Set the text of the link
                            press: function (oEvent) {
                                var sHostname = window.location.hostname;
                                var sProtocol = window.location.protocol;
                                var sPort = window.location.port; // Get the port from the current URL

                                // Form the URL with the data
                                // Form the URL with the data
                                var sLink = sProtocol + "//" + sHostname + (sPort ? ":" + sPort : "") + "/sap/bc/ui2/flp/FioriLaunchpad.html#ZSSCET622QT_25-manage?ProjID=" + encodeURIComponent(oFifthColumnData);
                                console.log(" Link Pressed - URL with data: " + sLink);

                                // Open the URL in a new window
                                window.open(sLink, "_blank");
                            }
                        });

                        // Add the link to the cell
                        oItem.addCell(oLink);

                        // Mark the item as processed
                        oItem.data("processed", true);


                    });
                }
            });
        }

        return
    },

    onButtonPress: function (oEvent) {

        console.log("Button clicked!");

        // if the Proiect is in the Edit Mode
        if (this._isEditMode()) {

            var oWasteField = sap.ui.getCore().byId("com.kelda.yw.ssc.fe.trx.wspquoteapp622.25::sap.suite.ui.generic.template.ObjectPage.view.Details::ZCDS_SSC_C_622_INFRA_25--InfraCal_FieldGroupYN::InfFNFAddToWaste::Field");
            var sWasteFieldValue = oWasteField.getValue();

            // Get the button that was pressed
            var oButton = oEvent.getSource();
            // Get the current text of the button
            var sCurrentText = oButton.getText();

            // if Yes/No selected for the "Do you want to add it to waste field"
            if (sWasteFieldValue) {
                // Toggle the button text
                if (sCurrentText === "Enable F&F") {
                    oButton.setText("Disable F&F");
                }
                else {
                    sap.m.MessageToast.show('Please Empty the "Do you want to add it to waste field", to Disable the F&F calculator');
                }
            }
            // if Null value selected for the "Do you want to add it to waste field"
            else if (sWasteFieldValue === null || sWasteFieldValue === "") {
                if (sCurrentText === "Enable F&F") {
                    sap.m.MessageToast.show('Please Fill the "Do you want to add it to waste field", to Enable the F&F calculator');
                }
                else {
                    oButton.setText("Enable F&F");
                }
            }
        }
        else {
            sap.m.MessageToast.show('Enable edit mode to make changes');
            return;
        }

    },

    // Fetching the objectpage and checking if its in editable mode
    _isEditMode: function () {
        var oView = this.getView();
        var oUIModel = oView.getModel("ui");
        return oUIModel.getProperty("/editable");
    },

    onExit: function () {
        console.log("onExit called");
        if (this._oLink) {
            this._oLink.destroy();
            this._oLink = null;
        }
    }

});

