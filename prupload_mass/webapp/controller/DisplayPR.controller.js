sap.ui.loader.config({
    shim: {
        "com/sap/prupload/pruploadlatest/files/xlsx": {
            amd: true, // When being required, UI5 temporarily disables the global `define` to allow the third party lib register its global name to `globalThis` or `window`.
            exports: "XLSX", // Name of the global variable under which SheetJS exports its module value
        },
    }
});


sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "com/sap/prupload/pruploadlatest/files/xlsx",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "com/sap/prupload/pruploadlatest/util/Formatter",
    "com/sap/prupload/pruploadlatest/util/ExcelHandler",
    "sap/m/ProgressIndicator",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"



], (Controller, XLSX, JSONModel, MessageBox, MessageToast, Fragment, Formatter, ExcelHandler, ProgressIndicator, Filter, FilterOperator) => {
    "use strict";

    return Controller.extend("com.sap.prupload.pruploadlatest.controller.DisplayPR", {
        formatter: Formatter,
        onInit() {

            var oAppModel = new JSONModel({
                "count": 0,
                "poVisible": false,
                "countRecord": 0
            });
            this.getOwnerComponent().setModel(oAppModel, "AppModel");


            var oDataModel = new sap.ui.model.json.JSONModel({
                requestStart: null,
                requestEnd: null,
                deliveryStart: null,
                deliveryEnd: null
            });
            this.getView().setModel(oDataModel, "filterDateModel");


        },

        onSearch: function (oEvent) {

            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl;
            oModel.setSizeLimit(100000);
            var sUrl = oModel.sServiceUrl;
            var oTableData = [];
            var that = this;
            var aFilters = [];
            var sPR = this.byId("idFilterPR").getValue();
            var sPlant = this.byId("Plant").getValue().toUpperCase();
            var sMaterial = this.byId("Material").getValue().toUpperCase();
            var sVendor = this.byId("Vendor").getValue().toUpperCase();
            var bDeleted = this.byId("idDelete").getSelected();
            var bClosed = this.byId("idClose").getSelected();
            var dRequestStart = this.byId("DRS1").getValue() === "" ? [] : this.byId("DRS1").getValue().split("–");
            var dDelStart = this.byId("DRS2").getValue() === "" ? [] : this.byId("DRS2").getValue().split("–");
            aFilters.push(`IsDeleted eq ` + bDeleted);
            aFilters.push(`IsClosed eq ` + bClosed);
            aFilters.push(`PRType eq 'ZCNB'`);
            if (sPR) aFilters.push("PurchaseRequisition eq " + "'" + sPR + "'");
            if (sPlant) aFilters.push("Plant eq " + "'" + sPlant + "'");
            if (sMaterial) aFilters.push("Material eq " + "'" + sMaterial + "'");
            if (sVendor) aFilters.push("Supplier eq " + "'" + sVendor + "'");
            if (dRequestStart.length !== 0) aFilters.push("(PurReqCreationDate ge " + dRequestStart[0].trim() + " and PurReqCreationDate le " + dRequestStart[1].trim() + ")");
            if (dDelStart.length !== 0) aFilters.push("(DeliveryDate ge " + dDelStart[0].trim() + " and DeliveryDate le " + dDelStart[1].trim() + ")");
            var sFilterQuery = aFilters.length > 0 ? `$filter=${aFilters.join(' and ')}` : '';
            var oUrl = sUrl + "PurchaseReqnItem?$top=10000&" + sFilterQuery;
            $.ajax({
                type: "GET",
                url: oUrl,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                parameters: {
                    $top: null
                },
                success: function (data, xhr, jHxr) {
                    var oTblModel = new JSONModel({ tblitems: data.value });
                    that.getView().byId("displayTbl").setModel(oTblModel);
                    var iLen = that.getView().byId("displayTbl").getBinding("rows").iLength;
                    that.getView().getModel("AppModel").setProperty("/count", iLen);
                },
                error: function (error) {
                    // Handle errors (e.g., show an error message)
                    MessageBox.error("Error connecting to the Backend", error);
                }
            });
        },

        onPlantF4: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idPlant")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.prupload.pruploadlatest.view.fragments.PlantF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idPlant").open();
            }

        },
        onSearchPlant: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();

            if (sValue.length > 4) {
                var oFilter = new Filter({
                    filters: [
                        new Filter("PlantDescription", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }
            else {

                var oFilter = new Filter({
                    filters: [
                        new Filter("Plant", FilterOperator.Contains, sValue),
                        new Filter("PlantDescription", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }

            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },

        onPlantValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("Plant");
            oInput.setValue(oSelectedItem.getTitle());
        },




        onMaterialF4: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idMaterial")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.prupload.pruploadlatest.view.fragments.MaterialF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idMaterial").open();
            }

        },

        onSearchMaterial: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();
            var oFilter = new Filter("MaterialCode", FilterOperator.Contains, sValue);
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onMaterialValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("Material");
            oInput.setValue(oSelectedItem.getTitle());
        },

        // onPRTypeF4: function (oEvent) {
        //     var oView = this.getView();
        //     if (!this.byId("idPRType")) {
        //         Fragment.load({
        //             id: oView.getId(),
        //             name: "com.sap.prupload.pruploadlatest.view.fragments.PRTypeF4",
        //             controller: this
        //         }).then(function (oDialog) {
        //             oView.addDependent(oDialog);
        //             oDialog.open();
        //         });
        //     } else {
        //         this.byId("idPRType").open();
        //     }

        // },

        // onSearchPRType: function (oEvent) {
        //     var sValue = oEvent.getParameter("value").trim().toUpperCase();
        //     var oFilter = new Filter("PRType", FilterOperator.Contains, sValue);
        //     var oBinding = oEvent.getParameter("itemsBinding");
        //     oBinding.filter([oFilter]);
        // },
        // onPRTypeValueHelpDialogClose: function (oEvent) {
        //     var oSelectedItem = oEvent.getParameter("selectedItem"),
        //         oInput = this.byId("PRType");
        //     oInput.setValue(oSelectedItem.getTitle());
        // },

        onVendorF4: function (oEvent) {
            var oView = this.getView();
            if (!this.byId("idVendor")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.prupload.pruploadlatest.view.fragments.VendorF4",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.open();
                });
            } else {
                this.byId("idVendor").open();
            }

        },
        onSearchVendor: function (oEvent) {
            var sValue = oEvent.getParameter("value").trim().toUpperCase();

            if (sValue.length > 10) {
                var oFilter = new Filter({
                    filters: [
                        new Filter("VendorName", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }
            else {
                var oFilter = new Filter({
                    filters: [
                        new Filter("Vendor", FilterOperator.Contains, sValue),
                        new Filter("VendorName", FilterOperator.Contains, sValue)
                    ],
                    and: false // Use OR logic
                });
            }
            var oBinding = oEvent.getParameter("itemsBinding");
            oBinding.filter([oFilter]);
        },
        onVendorValueHelpDialogClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem"),
                oInput = this.byId("Vendor");
            oInput.setValue(oSelectedItem.getTitle());
        },


        onClear: function () {


            var oView = this.getView();
            var oModel = oView.getModel("filterDateModel");


            this.byId("idFilterPR").setValue("");
            this.byId("Plant").setValue("");
            this.byId("Material").setValue("");
            this.byId("Vendor").setValue("");

            // Uncheck CheckBoxes
            this.byId("idDelete").setSelected(false);
            this.byId("idClose").setSelected(false);

            // Clear DateRangeSelections
            // this.byId("DRS2").setDateValue(null);
            // this.byId("DRS2").setSecondDateValue(null);
            // this.byId("DRS1").setDateValue(null);
            // this.byId("DRS1").setSecondDateValue(null);

            // Clear DateRangeSelections using setDateRange
            // var oDRS1 = this.byId("DRS1");
            // var oDRS2 = this.byId("DRS2");

            oModel.setProperty("/requestStart", null);
            oModel.setProperty("/requestEnd", null);
            oModel.setProperty("/deliveryStart", null);
            oModel.setProperty("/deliveryEnd", null);

            var oTblModel = new JSONModel({ tblitems: []  });
            this.getView().byId("displayTbl").setModel(oTblModel);

        },

        onDownloadExcel: function (oEvent) {
           
            // Directory for the template
            var sFilePath = "com/sap/prupload/pruploadlatest/files/PR_Upload_Templates.xlsx";
            // name of the file after download 
            var sDownloadFileName= "PR Upload Templates.xlsx";

            // download excel template
            ExcelHandler.onDownloadExcel(this, sFilePath,sDownloadFileName );
        },

        onUpload: function (e) {

            // excel file instance
            const file = e.getParameter("files")[0];

            // Validation service data model
            var oValidateModel = this.getView().getModel("validationService");

            // Validation service suffix url
            var sValidationServiceUrl = "/ZPRLIST/com.sap.gateway.srvd.zui_pr_upload.v0001.uploadPRItems(...)"

            // view model to display validated data
            var oAppModel = this.getView().getModel("AppModel");

            // validation service payload prototype
            var oValidatePayloadPrototype = {
                "preq_no": "090",
                "_Item": [{
                    "PREQ_NO": "",
                    "PRITEM_NO": "",
                    "PLANT": "",
                    "PREQ_DATE": "",
                    "DELIV_DATE": "",
                    "PUR_GROUP": "",
                    "MATERIAL": "",
                    "UNIT": "",
                    "QUANTITY": "",
                    "FIXED_VEND": "",
                    "STORE_LOC": "",
                    "STATUS": "",
                    "ERROR_MSG": ""
                }]
            };

            // Define payload field to excel header name mapping
            var oPayloadFieldMapping = {
                "PREQ_NO": "PR number",
                "PREQ_DATE": "PR date",
                "PUR_GROUP": "Pur.Group",
                "MATERIAL": "Material",
                "QUANTITY": "PR Quantity",
                "UNIT": "PR Unit",
                "DELIV_DATE": "Delivery date",
                "PLANT": "Plant",
                "STORE_LOC": "Stor.Loc.",
                "FIXED_VEND": "Fix.Vendor"
            };
            
            // excel header and data row number
            var nHearderRowNumber = 3, nDataRowNumber = 7;

            // Entry Point Function to initiate the Upload and Validation Process
            ExcelHandler._import(file, oValidateModel ,sValidationServiceUrl, oAppModel, oValidatePayloadPrototype, oPayloadFieldMapping, nHearderRowNumber, nDataRowNumber, this);

           
        },

////////////////////////////////////////// added in ExcelHandler.Js //////////////////////////////////////////////////////////          

        // _import: function (file) {

        //     this.localModel = new sap.ui.model.json.JSONModel();
        //     this.getView().setModel(this.localModel, "localModel");
        //     var that = this;
        //     var excelData = {};
        //     var oValidateModel = this.getView().getModel("validationService");
        //     if (file && window.FileReader) {
        //         var reader = new FileReader();
        //         var that = this;
        //         reader.onload = function (e) {
        //             var data = e.target.result;
        //             var workbook = XLSX.read(data, {
        //                 type: 'binary'
        //             });
        //             workbook.SheetNames.forEach(function (sheetName) {
        //                 excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName], {
        //                     raw: false,
        //                     dateNF: 'yyyy-mm-dd',
        //                 });

        //             });
        //             if (excelData) {

        //                 var finalArray = [];
        //                 var oPayloadExcel = [];
        //                 var oModel = new JSONModel(excelData);
        //                 oValidateModel.setSizeLimit(10000);
        //                 var batchpayload = [];
        //                 var finalpayload = [];
        //                 finalArray = excelData.slice(1);
        //                 oPayloadExcel = finalArray.splice(1, 3);
        //                 var oPayload = that.createValidatePayLoad(finalArray);
        //                 while (oPayload._Item.length) {
        //                     batchpayload.push(oPayload._Item.splice(0, 100));
        //                 }
        //                 for (var i = 0; i < batchpayload.length; i++) {
        //                     var result = {

        //                         "preq_no": "090",
        //                         "_Item": batchpayload[i]
        //                     }
        //                     finalpayload.push(result);
        //                 }
        //                 console.log(finalpayload);
        //                 var aError = [];
        //                 that.makeAjaxRequest(finalpayload, finalpayload[0]._Item.length);
        //             }
        //             else {

        //                 that.getView().byId("excelTable").setVisible(false);
        //             }

        //         };
        //         reader.onerror = function (ex) {
        //             console.log(ex);
        //         };
        //         reader.readAsBinaryString(file);
        //     }
        // },
        // createValidatePayLoad: function (oJsonData) {
        //     var oGroupedData = {};
        //     var oJsonPayload = [];
        //     oJsonPayload = oJsonData.slice(1);
        //     oJsonPayload.forEach(function (row) {
        //         var prNumber = row["Item data"];
        //         if (!oGroupedData[prNumber]) {
        //             oGroupedData[prNumber] = {
        //                 LineItems: []
        //             };
        //         }
        //         var oLineItem = {
        //             MATERIAL: row["__EMPTY_2"],
        //             QUANTITY: parseInt(row["__EMPTY_3"]),
        //             UNIT: row["__EMPTY_4"],
        //             PUR_GROUP: row["__EMPTY_1"],
        //             DELIV_DATE: "20250625",
        //             PLANT: row["__EMPTY_6"],
        //             STORE_LOC: row["__EMPTY_7"],
        //             FIXED_VEND: "",
        //             ERROR_MSG: row["Error"],
        //             PREQ_DATE: row["__EMPTY"]
        //         };
        //         oGroupedData[prNumber].LineItems.push(oLineItem);
        //     });


        //     Object.keys(oGroupedData).forEach(function (prNumber) {
        //         var lineItems = oGroupedData[prNumber].LineItems;
        //         lineItems.forEach(function (item, index) {
        //             item.pritem_no = (index + 1) * 10;
        //             item.PREQ_NO = prNumber;
        //         });
        //     });

        //     var allItems = [];
        //     Object.keys(oGroupedData).forEach(function (prNumber) {
        //         allItems = allItems.concat(oGroupedData[prNumber].LineItems);
        //     });
        //     var that = this;
        //     var oPayload = {
        //         "preq_no": "090",
        //         "_Item": allItems.map(function (item) {
        //             return {

        //                 "PREQ_NO": item.PREQ_NO,
        //                 "PRITEM_NO": item.pritem_no.toString(),
        //                 "PLANT": item.PLANT === undefined ? "" : item.PLANT.toString(),
        //                 "PREQ_DATE": item.PREQ_DATE === undefined ? "" : that.dateformat(item.PREQ_DATE.toString()),
        //                 // "PREQ_DATE": item.PREQ_DATE === undefined ? "" : item.PREQ_DATE.toString(),
        //                 "DELIV_DATE": item.DELIV_DATE === undefined ? "" : that.dateformat(item.DELIV_DATE.toString()),
        //                 "PUR_GROUP": item.PUR_GROUP === undefined ? "" : item.PUR_GROUP.toString(),
        //                 "MATERIAL": item.MATERIAL === undefined ? "" : item.MATERIAL.toString(),
        //                 "UNIT": item.UNIT === undefined ? "" : item.UNIT.toString(),
        //                 "QUANTITY": item.QUANTITY === undefined ? "" : item.QUANTITY.toString(),
        //                 "FIXED_VEND": item.FIXED_VEND === undefined ? "" : item.FIXED_VEND.toString(),
        //                 "STORE_LOC": item.STORE_LOC === undefined ? "" : item.STORE_LOC.toString(),
        //                 "STATUS": "",
        //                 "ERROR_MSG": ""
        //             };
        //         })
        //     };

        //     console.log(oPayload);
        //     return oPayload;
        // },

        // dateformat: function (input) {

        //     // var year = dateValue.substr(0, 4)
        //     // var month = dateValue.substr(4, 2)
        //     // var date = dateValue.substr(6, 2)
        //     // var dateStr = year + "-" + month + "-" + date;
        //     // return dateStr;

        //     if (!input) return "";

        //     const inputStr = String(input).trim();

        //     // Case 1: Handle "20250619" (yyyymmdd)
        //     if (/^\d{8}$/.test(inputStr)) {
        //         const year = inputStr.slice(0, 4);
        //         const month = inputStr.slice(4, 6);
        //         const day = inputStr.slice(6, 8);
        //         return `${year}-${month}-${day}`;
        //     }

        //     // Case 2: Handle "6/19/25" (Excel auto-converted date format)
        //     if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(inputStr)) {
        //         const parts = inputStr.split("/");
        //         const month = parseInt(parts[0]);
        //         const day = parseInt(parts[1]);
        //         const year = parseInt(parts[2]) + 2000; // assume 20xx
        //         if (
        //             month >= 1 && month <= 12 &&
        //             day >= 1 && day <= 31 &&
        //             year >= 2000 && year <= 2099
        //         ) {
        //             const mm = String(month).padStart(2, "0");
        //             const dd = String(day).padStart(2, "0");
        //             return `${year}-${mm}-${dd}`;
        //         }
        //     }
        //     return ""; // Invalid format

        // },

        // makeAjaxRequest: async function (requests, count) {
        //     var that = this;
        //     var oValidateModel = this.getView().getModel("validationService");

        //     var oData = [];
        //     const sUpdateGroupId = "createPrValidateGroup";
        //     var iTotalRequests = requests.length;
        //     var iCompletedRequests = 0;


        //     for (var i = 0; i < requests.length; i++) {
        //         this.getView().byId("idProg").setVisible(true);

        //         var oContext = oValidateModel.bindContext("/ZPRLIST/com.sap.gateway.srvd.zui_pr_upload.v0001.uploadPRItems(...)", null, {
        //             // $$updateGroupId: sUpdateGroupId
        //         });
        //         oContext.setParameter("preq_no", requests[i].preq_no);
        //         oContext.setParameter("_Item", requests[i]._Item);
        //         try {
        //             await oContext.execute().then(function (oAction) {
        //                 iCompletedRequests++;
        //                 const fProgress = (iCompletedRequests / iTotalRequests) * 100;
        //                 that.getView().byId("idProg").setDisplayValue("Validating " + Math.round(fProgress) + "%");
        //                 that.getView().byId("idProg").setPercentValue(Math.round(fProgress));
        //                 var oActionContext = oContext.getBoundContext();
        //                 var oResponse = oActionContext.getObject().value;
        //                 for (let i = 0; i < oResponse.length; i++) {
        //                     oData.push(oResponse[i]);
        //                     if (oResponse[i].STATUS === "E") {
        //                         that.getView().byId("createPR").setEnabled(false);
        //                     }
        //                 }


        //                 that.getView().setModel(new JSONModel(oData), "excelData");
        //                 oValidateModel.refresh();
        //             });
        //         }
        //         catch (error) {
        //             that.getView().byId("createPR").setEnabled(false);
        //             MessageBox.error("Please enter valid excel data", {
        //                 onClose: function () {

        //                     this.file = null;
        //                     this.file_name = null;

        //                     // Reset file uploader control
        //                     var oFileUploader = this.getView().byId("fileUploaderId"); // Replace with actual ID
        //                     if (oFileUploader) {
        //                         oFileUploader.setValue(""); // or oFileUploader.clear() if supported
        //                     }

        //                     // Reset progress indicator
        //                     var oProgress = this.getView().byId("idProg");
        //                     if (oProgress) {
        //                         oProgress.setState("None");
        //                         oProgress.setDisplayValue("");
        //                         oProgress.setPercentValue(0);
        //                     }
        //                 }.bind(this) // Important: bind 'this' to access controller context
        //             });

        //             that.getView().byId("idProg").setState("Error");
        //             that.getView().byId("idProg").setDisplayValue("Validation Failed...");
        //         }
        //         await oValidateModel.submitBatch(sUpdateGroupId);
        //         if (iTotalRequests === iCompletedRequests) {
        //             var k = 0;
        //             that.getView().getModel("AppModel").setProperty("/countRecord", count);
        //             // that.getView().byId("createPR").setEnabled(true);
        //             for (var j = 0; j < oData.length; j++) {
        //                 if (oData[j].STATUS === "S") {
        //                     k++;
        //                 }
        //             }
        //             if (k === requests[0]._Item.length) {
        //                 this.getView().byId("createPR").setEnabled(true);
        //             }
        //             this.getView().byId("idProg").setState("Success");
        //             this.getView().byId("idProg").setDisplayValue("Validation Completed");
        //         }
        //     }
        // },

///////////////////////////// added in ExcelHandler.Js //////////////////////////////////////////////     
        
        onCreatePR: function (oEvent) {

            this.createPayload();
        },

        handlePopoverPress: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();
            if (!this._pPopover) {
                this._pPopover = Fragment.load({
                    id: oView.getId(),
                    name: "com/sap/prupload/pruploadlatest/view/fragments/Error",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    oPopover.bindElement("excelData" + oEvent.getSource().getBindingContext("excelData").sPath);
                    return oPopover;
                });
            }
            this._pPopover.then(function (oPopover) {
                oPopover.openBy(oButton);
                oPopover.bindElement("excelData>" + oEvent.getSource().getBindingContext("excelData").sPath);
            });
        },

        handlePOPopoverPress: function (oEvent) {
            var oButton = oEvent.getSource(),
                oView = this.getView();


            if (!this._poPopover) {
                this._poPopover = Fragment.load({
                    id: oView.getId(),
                    name: "com/sap/prupload/pruploadlatest/view/fragments/PoError",
                    controller: this
                }).then(function (oPopover) {
                    oView.addDependent(oPopover);
                    oPopover.bindElement("podata" + oEvent.getSource().getBindingContext("podata").sPath);
                    return oPopover;
                });
            }
            this._poPopover.then(function (oPopover) {
                oPopover.openBy(oButton);
                oPopover.bindElement("podata>" + oEvent.getSource().getBindingContext("podata").sPath);
            });
        },

        createPayload: async function () {
            var that = this;
            var oModelData = this.createPrPayload(this.getView().getModel("excelData").getData());
            var aResult = [];
            var oModel = this.getView().getModel();
            var aFilters = [];
            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl;
            const sUpdateGroupId = "createPrGroup";
            var batchCreatePayLoad = []
            var oContext;
            var oPostingError;
            var aResult = [];
            var iTotalPrRequests = oModelData.length;
            var iCompletedPrRequests = 0
            while (oModelData.length) {
                batchCreatePayLoad.push(oModelData.splice(0, 10));
            }
            console.log(batchCreatePayLoad);
            for (var i = 0; i < batchCreatePayLoad.length; i++) {
                this.getView().byId("idPR").setVisible(true);
                this.getView().byId("createPR").setEnabled(false);
                this.getView().byId("idPR").setDisplayValue("Creating PR of " + iCompletedPrRequests + "/" + iTotalPrRequests);
                oContext = oModel.bindList("/PurchaseReqn", {
                    $$updateGroupId: sUpdateGroupId
                });
                oContext.setContext(null);
                for (let item of batchCreatePayLoad[i]) {
                    iCompletedPrRequests++;
                    oContext.create(item);
                }
                await oModel.submitBatch(sUpdateGroupId).then((oResponse) => {
                    this.getView().byId("idPR").setDisplayValue("Creating PR of " + iCompletedPrRequests + "/" + iTotalPrRequests);
                    var oResult = oContext.getHeaderContext().oBinding.oCache.aElements
                    // var aResponse = [];
                    // for (const key in oResult) {
                    //     if (key !== "") {
                    //         aResponse.push(oResult[key][0].message);
                    //     }
                    // }
                    for (var i = 0; i < oResult.length; i++) {
                        // var oString = /\d/.test(aResponse[i]);
                        aFilters.push("PurchaseRequisition eq " + "'" + oResult[i].PurchaseRequisition + "'")
                    }
                    var sFilterQuery = aFilters.length > 0 ? `$filter=${aFilters.join(' or ')}` : '';
                    var oUrl = sUrl + "PurchaseReqnItem?" + sFilterQuery + `and PRType eq 'ZCNB'`;
                    $.ajax({
                        type: "GET",
                        url: oUrl,
                        dataType: "json",
                        contentType: "application/json; charset=utf-8",
                        success: function (data, xhr, jHxr) {

                            that.getView().byId("excelTable").setVisible(false);
                            that.getView().byId("poTbl").setVisible(true);
                            that.getView().setModel(new JSONModel(data.value), "podata");
                            that.getView().byId("idPo").setEnabled(true);
                            oModel.refresh();
                            // that.getView().byId("poTbl").setModel("podata",data.value);
                            // var iLen = that.getView().byId("poTbl").getBinding("rows").iLength;
                            // that.getView().getModel("AppModel").setProperty("/count", iLen);
                        },
                        error: function (error) {
                            // Handle errors (e.g., show an error message)
                            MessageBox.error("Error connecting to the Backend", error);
                        }
                    });



                }).catch((oError) => {
                    MessageBox.error("Batch submission failed:", oError);
                    oPostingError = "X";
                    this.getView().byId("idPR").setState("Error");
                    this.getView().byId("idPR").setDisplayValue("Creation of PR failed");
                });
                if (oPostingError !== "X") {
                    if (iTotalPrRequests === iCompletedPrRequests) {
                        this.getView().byId("idPR").setState("Success");
                        this.getView().byId("idPR").setPercentValue(100);
                        this.getView().byId("idPR").setDisplayValue("Creation of PR Completed");
                    }
                }
                else {
                    this.getView().byId("idPR").setState("Error");
                    this.getView().byId("idPR").setPercentValue(0);
                    this.getView().byId("idPR").setDisplayValue("Creation of PR failed");
                }
            }
        },

        createPrPayload: function (aPayLoad) {
            var pPayLoad = [];
            var oGroupedData = {};
            var oLineItem;
            var that = this;
            aPayLoad.forEach(function (row) {
                var prNumber = row["PREQ_NO"];
                if (!oGroupedData[prNumber]) {
                    oGroupedData[prNumber] = {
                        PurchaseRequisitionType: "ZCNB",
                        PurReqnDescription: "Test PR",
                        PurReqnHeaderNote: "Header Note",
                        _PurchaseRequisitionItem: []
                    };
                }
                oLineItem = {
                    PurchasingGroup: row["PUR_GROUP"],
                    Material: row["MATERIAL"],
                    RequestedQuantity: row["QUANTITY"].toString(),
                    BaseUnit: row["UNIT"],
                    // PurchaseRequisitionPrice: "200",
                    // PurReqnItemCurrency: "KRW",  that.dateformat(item.DELIV_DATE.toString())
                    PurReqCreationDate: row["PREQ_DATE"].toString(),
                    BaseUnitISOCode: row["UNIT"],
                    PurchasingOrganization: "KR01",
                    DeliveryDate: row["DELIV_DATE"],
                    Plant: row["PLANT"],
                    StorageLocation: row["STORE_LOC"],
                    FixedSupplier: row["FIXED_VEND"]
                };
                console.log(oLineItem);
                oGroupedData[prNumber]._PurchaseRequisitionItem.push(oLineItem);
            });
            var oGroupData = [oGroupedData];


            for (let key in oGroupData[0]) {
                console.log(key, oGroupData[0]);
                pPayLoad.push(oGroupData[0][key]);
            }


            return pPayLoad;
        },

        onNavExcel: function (oEvent) {
            var oView = this.getView();
            var that = this;
            if (!this.byId("ExcelUpload")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.prupload.pruploadlatest.view.fragments.ExcelUploadDisplay",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    that.getView().getModel("AppModel").setProperty("/countRecord", 0);
                    oDialog.open();
                });
            } else {
                this.byId("ExcelUpload").open();
                that.getView().getModel("AppModel").setProperty("/countRecord", 0);
            }
        },

        onCopy: function () {
            var oView = this.getView();
            var sUrl = oView.getModel().sServiceUrl + `PurchaseReqnItem?$top=10000&$filter=PRType eq 'ZCNB' IsDeleted eq false and IsClosed eq false`;
            var oTable = this.byId("displayTbl");
            var aSelectedIndices = oTable.getSelectedIndices();

            if (aSelectedIndices.length === 0) {
                MessageBox.error("Please select an item.");
                return;
            }

            if (aSelectedIndices.length > 1) {
                MessageBox.error("Multiple items cannot be copied for PR creation. Please select a single item.",
                    {
                        onClose: function () {
                            oTable.clearSelection();
                            $.ajax({
                                type: "GET",
                                url: sUrl,
                                dataType: "json",
                                success: function (data) {
                                    var oTblModel = new JSONModel({ tblitems: data.value });
                                    that.getView().byId("displayTbl").setModel(oTblModel);
                                },
                                error: function (error) {
                                    console.error("Table refresh failed:", error);
                                }
                            });
                        }
                    }
                );
                return;
            }


            var aSelectedItems = aSelectedIndices.map(function (iIndex) {
                var oContext = oTable.getContextByIndex(iIndex);
                return oContext.getObject();
            });

            var oDialogModel = new JSONModel({ selectedItems: aSelectedItems });
            oView.setModel(oDialogModel, "dialogModel");

            if (!this.byId("copyCreateDialog")) {
                Fragment.load({
                    id: oView.getId(),
                    name: "com.sap.prupload.pruploadlatest.view.fragments.CopyCreateDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);

                    var oCopyTable = oView.byId("copyCreateTable");
                    if (oCopyTable) {
                        oCopyTable.setVisibleRowCount(1);
                    }

                    oDialog.open();
                });
            } else {
                this.byId("copyCreateDialog").open();
            }
        },




        onCancel: function (oEvent) {
            this.getView().byId("ExcelUpload").close();
            this.getView().byId("ExcelUpload").destroy();
            if (this.getView().getModel("excelData")) {
                this.getView().getModel("excelData").setData({});
            }
            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl + `PurchaseReqnItem?$top=10000&$filter=PRType eq 'ZCNB' and IsDeleted eq false and IsClosed eq false`;
            oModel.setSizeLimit(10000);
            var oTableData = [];
            var that = this;
            $.ajax({
                type: "GET",
                url: sUrl ,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                parameters: {
                    $top: null
                },
                success: function (data, xhr, jHxr) {
                    var oTblModel = new JSONModel({ tblitems: data.value });
                    that.getView().byId("displayTbl").setModel(oTblModel);
                    var iLen = that.getView().byId("displayTbl").getBinding("rows").iLength;
                    that.getView().getModel("AppModel").setProperty("/count", iLen);

                },
                error: function (error) {
                    console.error("Table Operation failed:", error);
                }
            });

        },
        onCopyCreatePR: async function () {
            const oDialogModel = this.getView().getModel("dialogModel");
            const aItems = oDialogModel.getProperty("/selectedItems");
            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl;
            var that = this;
            var token;
            var CreatePayLoad = []

            let bValid = true;
            let sErrorMessage = "";
            aItems.forEach((item, index) => {
                var quantity = Number(item.RequestedQuantity);
                if (
                    quantity === null || quantity === undefined || quantity === "" ||
                    isNaN(quantity) || Number(quantity) <= 0 ||
                    !Number.isInteger(Number(quantity))
                ) {
                    bValid = false;
                    sErrorMessage = `Invalid quantity at row ${index + 1}. It must be a non-empty, positive integer.`;
                }
            });
            if (!bValid) {
                sap.m.MessageBox.error(sErrorMessage);
                return;
            }
            const date = new Date();
            date.setDate(date.getDate() + 7)

            var rdate = date;

            var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
                pattern: "yyyy-MM-dd"
            });

            var delDate = oDateFormat.format(date);
            const oSinglePR = {
                PurchaseRequisitionType: "ZCNB",
                PurReqnDescription: "Test PR",
                PurReqnHeaderNote: "Header Note",
                _PurchaseRequisitionItem: aItems.map(item => ({
                    PurchasingGroup: item.PurchasingGroup,
                    Material: item.Material,
                    RequestedQuantity: parseInt(item.RequestedQuantity),
                    BaseUnit: item.BaseUnit,
                    BaseUnitISOCode: item.BaseUnitISOCode,
                    PurchasingOrganization: "KR01",
                    DeliveryDate: delDate,
                    Plant: item.Plant,
                    StorageLocation: item.StorageLocation,
                    FixedSupplier: item.FixedSupplier,
                    PurchaseRequisitionPrice: 150,
                    PurReqnItemCurrency: "KRW"
                }))
            };
            CreatePayLoad.push(oSinglePR);
            console.log(oSinglePR);
            await $.ajax({
                url: sUrl + "PurchaseReqn",
                method: "GET",
                contentType: "application/json",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    token = data.getResponseHeader("X-CSRF-Token");
                },
                error: function (result, xhr, data) {
                    console.log("Error");
                }
            });
            for (let item of CreatePayLoad) {
                $.ajax({
                    url: sUrl + "PurchaseReqn",
                    method: "POST",
                    contentType: "application/json",
                    Accept: "application/json",
                    headers: {
                        "X-CSRF-Token": token,
                    },
                    data: JSON.stringify(item),


                    success: function (response) {
                        sap.m.MessageBox.success("Purchase Requisition created successfully.", {
                            onClose: function () {
                                this.onCopyCancel();
                                this.onSearch;
                            }.bind(this)
                        });
                    }.bind(this),
                    error: function (xhr, status, error) {
                        sap.m.MessageBox.error("PR creation failed.", {
                            onClose: function () {
                                this.onCopyCancel();
                            }.bind(this)
                        });
                    }.bind(this),
                });
            }
        },
        onCopyCancel: function () {

            this.getView().byId("copyCreateDialog").close();
            this.getView().byId("copyCreateDialog").destroy();

            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl + `PurchaseReqnItem?$top=10000&$filter=PRType eq 'ZCNB' and IsDeleted eq false and IsClosed eq false`;
            oModel.setSizeLimit(10000);
            var oTableData = [];
            var that = this;
            $.ajax({
                type: "GET",
                url: sUrl,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                parameters: {
                    $top: null
                },
                success: function (data, xhr, jHxr) {
                    var oTblModel = new JSONModel({ tblitems: data.value });
                    var oTable = that.getView().byId("displayTbl");
                    oTable.setModel(oTblModel);
                    oTable.clearSelection();

                },
                error: function (error) {
                    console.error("Delete failed:", error);
                }
            });

        },



        onDelete: async function (oEvent) {

            var oTable = this.byId("displayTbl");
            var selectedItems = oTable.getSelectedIndices();
            var oModel = this.getOwnerComponent().getModel();
            var oRequestor = oModel.oRequestor;
            var sToken = oRequestor.mHeaders['X-CSRF-Token'];
            var sUrl = oModel.sServiceUrl;
            var that = this;

            if (selectedItems.length === 0) {
                MessageBox.error("Please select at least one item!");
                return;
            }


            let invalidItems = [];
            let prNumbers = {};
            let duplicatePRs = [];

            selectedItems.forEach(index => {
                var oItem = oTable.getModel().getProperty(oTable.getContextByIndex(index).getPath());

                if (oItem.ProcessingStatus !== "N" && oItem.ProcessingStatus !== "X") {
                    invalidItems.push(oItem.PurchaseRequisition);
                }

                let pr = oItem.PurchaseRequisition;

                if (prNumbers[pr]) {
                    duplicatePRs.push(pr);
                } else {
                    prNumbers[pr] = true;
                }

            });

            if (duplicatePRs.length > 0) {
                MessageBox.error("Items having the same PR number cannot be deleted at once: " + [...new Set(duplicatePRs)].join(", "));
                return;
            }

            if (invalidItems.length > 0) {
                MessageBox.error(
                    "The following PR numbers cannot be marked for deletion/close: " + invalidItems.join(", ") +
                    ". Please uncheck these items for continuing the deletion of other items.",
                    {
                        onClose: function () {
                            var sGetUrl = sUrl + `PurchaseReqnItem?$top=10000&$filter=PRType eq 'ZCNB' and IsDeleted eq false and IsClosed eq false`;
                            oTable.clearSelection();
                            $.ajax({
                                type: "GET",
                                url: sGetUrl,
                                dataType: "json",
                                success: function (data) {
                                    var oTblModel = new JSONModel({ tblitems: data.value });
                                    that.getView().byId("displayTbl").setModel(oTblModel);
                                },
                                error: function (error) {
                                    console.error("Table refresh failed:", error);
                                }
                            });
                        }
                    }
                );
                return;
            }



            let deletionList = [];
            let closeList = [];

            let promises = selectedItems.map(index => {
                var oItem = oTable.getModel().getProperty(oTable.getContextByIndex(index).getPath());

                if (oItem.IsDeleted || oItem.IsClosed) {
                    MessageBox.error("Item " + oItem.PurchaseRequisition + " already deleted/closed.");
                    return Promise.resolve();
                }

                if (oItem.ProcessingStatus !== "N" && oItem.ProcessingStatus !== "X") {
                    MessageBox.error("Item " + oItem.PurchaseRequisition + " cannot be marked for deletion/close.");
                    return Promise.resolve();
                }

                let sValue = oItem.ProcessingStatus === "N";
                let sCloseValue = oItem.ProcessingStatus === "X";

                return new Promise((resolve, reject) => {
                    $.ajax({
                        type: "GET",
                        url: `${sUrl}PurchaseReqnItem(PurchaseRequisition='${oItem.PurchaseRequisition}',PurchaseRequisitionItem='${oItem.PurchaseRequisitionItem}')`,
                        // url : `${sUrl}PurchaseReqnItem(PurchaseRequisition='${oItem.PurchaseRequisition}',PurchaseRequisitionItem='${oItem.PurchaseRequisitionItem}')?$filter=PRType eq 'ZCNB'`,

                        dataType: "json",
                        success: function (data, xhr, jHxr) {
                            var eTag = jHxr.getResponseHeader("ETag");
                            $.ajax({
                                type: "PATCH",
                                url: `${sUrl}PurchaseReqnItem/${oItem.PurchaseRequisition}/${oItem.PurchaseRequisitionItem}`,
                                data: JSON.stringify({ "IsDeleted": sValue, "IsClosed": sCloseValue }),
                                dataType: "json",
                                beforeSend: function (xhr) {
                                    xhr.setRequestHeader('X-CSRF-Token', sToken);
                                    xhr.setRequestHeader('If-Match', eTag);
                                },
                                contentType: "application/json; charset=utf-8",
                                success: function () {
                                    if (sValue) {
                                        deletionList.push(oItem.PurchaseRequisition);
                                    } else {
                                        closeList.push(oItem.PurchaseRequisition);
                                    }
                                    resolve();
                                },
                                error: function (error) {
                                    console.error("Delete failed:", error);
                                    reject(error);
                                }
                            });
                        },
                        error: function (error) {
                            console.error("Fetch failed:", error);
                            reject(error);
                        }
                    });
                });
            });

            Promise.all(promises).then(() => {
                let message = "";
                if (deletionList.length > 0) {
                    message += "Marked for deletion: " + deletionList.join(", ") + ".\n";
                }
                if (closeList.length > 0) {
                    message += "Marked for closing: " + closeList.join(", ") + ".";
                }
                if (message) {
                    MessageBox.success(message);
                }
                var sGetUrl = sUrl + `PurchaseReqnItem?$top=10000&$filter=PRType eq 'ZCNB' and IsDeleted eq false and IsClosed eq false`;
                $.ajax({
                    type: "GET",
                    url: sGetUrl,
                    dataType: "json",
                    success: function (data) {
                        var oTblModel = new JSONModel({ tblitems: data.value });
                        that.getView().byId("displayTbl").setModel(oTblModel);
                    },
                    error: function (error) {
                        console.error("Table refresh failed:", error);
                    }
                });
            }).catch(error => {
                MessageBox.error("PR item deletion failed.");
            });
        },



        onPoValidation: function (oEvent) {
            this.getView().byId("fileUpload").setVisible(false);
            this.getView().byId("idProg").setVisible(false);
            this.getView().byId("idPR").setVisible(false);
            var oTable = this.byId("poTbl");
            var aSelectedIndices = oTable.getSelectedIndices();
            if (aSelectedIndices.length === 0) {
                MessageBox.error("Please select an item.");
                return;
            }
            var aSelectedItems = aSelectedIndices.map(function (iIndex) {

                var oContextData = oTable.getContextByIndex(iIndex);
                return oContextData.getObject();
            });
            this.createValidatePOPayLoad(aSelectedItems);

        },




        onPOConvert: async function (oJsonData) {
            var oPayLoad = this.createPoPayload(oJsonData);
            var iPayLoadLen = oPayLoad.length;
            var oModel = this.getOwnerComponent().getModel("Purchase_order");
            var sUrl = oModel.sServiceUrl;
            var aFilters = [];
            var token;
            var aPR = [];
            var batchCreatePayLoad = [];
            var oContext;
            var sUpdateGroupId = "createPoGroup"
            var oView = this.getView();
            var aFinal = [];
            var sPrUrl = this.getOwnerComponent().getModel().sServiceUrl;
            var that = this;
            for (var data = 0; data < oJsonData.length; data++) {
                if (oJsonData[data].ProcessingStatus === "E") {
                    return;
                }
            }

            await $.ajax({
                url: sUrl,
                method: "GET",
                contentType: "application/json",
                headers: {
                    "X-CSRF-Token": "Fetch"
                },
                success: function (result, xhr, data) {
                    token = data.getResponseHeader("X-CSRF-Token");
                },
                error: function (result, xhr, data) {
                    console.log("Error");
                }
            });

            while (oPayLoad.length) {
                batchCreatePayLoad.push(oPayLoad.splice(0, 10));
            }
            for (var i = 0; i < batchCreatePayLoad.length; i++) {
                for (let item of batchCreatePayLoad[i]) {
                    await $.ajax({
                        url: sUrl + "PurchaseOrder",
                        method: "POST",
                        contentType: "application/json",
                        Accept: "application/json",
                        headers: {
                            "X-CSRF-Token": token,
                        },
                        data: JSON.stringify(item),
                        success: function (response) {
                            aFinal.push(response.PurchaseOrder);
                            aPR.push(response._PurchaseOrderItem[0].PurchaseRequisition);
                        },
                        error: function (xhr, status, error) {
                            console.error("PO creation error");
                            var message = xhr.responseJSON.error.details[0].message
                            var itemData = xhr.responseJSON.error.details[0].target.match(/\d+(\.\d+)?/g);

                            sap.m.MessageBox.error(message + " for item " + itemData[0] + " in " + item._PurchaseOrderItem[0].PurchaseRequisition);
                        }
                    });
                }
                if (aFinal.length === iPayLoadLen) {
                    MessageBox.success("Purchase Order(s)" + aFinal.join(",") + " have been created successfully", {
                        onClose: function () {
                            for (var i = 0; i < aPR.length; i++) {
                                // var oString = /\d/.test(aResponse[i]);
                                aFilters.push("PurchaseRequisition eq " + "'" + aPR[i] + "'")
                            }
                            var sFilterQuery = aFilters.length > 0 ? `$filter=${aFilters.join(' or ')}` : '';
                            var oUrl = sPrUrl + "PurchaseReqnItem?" + sFilterQuery + `and PRType eq 'ZCNB'`;
                            $.ajax({
                                type: "GET",
                                url: oUrl,
                                dataType: "json",
                                contentType: "application/json; charset=utf-8",
                                success: function (data, xhr, jHxr) {

                                    // that.getView().byId("excelTable").setVisible(false);
                                    // that.getView().byId("poTbl").setVisible(true);
                                    that.getView().setModel(new JSONModel(data.value), "podata");
                                    that.getView().byId("poTbl").clearSelection();
                                    that.getView().byId("idPo").setEnabled(false);
                                    oModel.refresh();
                                    // that.getView().byId("poTbl").setModel("podata",data.value);
                                    // var iLen = that.getView().byId("poTbl").getBinding("rows").iLength;
                                    // that.getView().getModel("AppModel").setProperty("/count", iLen);
                                },
                                error: function (error) {
                                    // Handle errors (e.g., show an error message)
                                    MessageBox.error("Error connecting to the Backend", error);
                                }
                            });

                        }.bind(this)
                    });
                }


            }


        },
        createValidatePOPayLoad: function (oJsonData) {
            // var oJsonData = this.getView().getModel("podata").getData();
            // console.log(oJsonData);
            var oGroupedData = {};
            var aPayload = [];
            oJsonData.forEach(function (row) {
                var prNumber = row["PurchaseRequisition"];
                if (!oGroupedData[prNumber]) {
                    oGroupedData[prNumber] = {
                        LineItems: []
                    };
                }
                var oLineItem = {
                    PurchaseRequisition: row["PurchaseRequisition"],
                    PurchaseRequisitionItem: row["PurchaseRequisitionItem"],
                    Material: row["Material"],
                    RequestedQuantity: parseInt(row["RequestedQuantity"]),
                    BaseUnit: row["BaseUnit"],
                    PurchasingGroup: row["PurchasingGroup"],
                    DeliveryDate: "DeliveryDate",
                    Plant: row["Plant"],
                    StorageLocation: row["StorageLocation"],
                    FixedSupplier: row["FixedSupplier"],
                    ERROR_MSG: row["Error"],
                    PurReqCreationDate: row["PurReqCreationDate"],
                    CompanyCode: row["CompanyCode"],
                    PurchasingInfoRecord: row["PurchasingInfoRecord"],
                };
                oGroupedData[prNumber].LineItems.push(oLineItem);
            });

            var allItems = [];
            Object.keys(oGroupedData).forEach(function (prNumber) {
                allItems = allItems.concat(oGroupedData[prNumber].LineItems);
            });
            var that = this;
            var oPayload = {
                "preq_no": "090",
                "_Item": allItems.map(function (item) {
                    return {
                        "PREQ_NO": item.PurchaseRequisition,
                        "PRITEM_NO": item.PurchaseRequisitionItem,
                        "PIR_NO": item.PurchasingInfoRecord,
                        "ERROR_MSG": ""

                    };
                })
            };

            console.log(oPayload);
            aPayload.push(oPayload);

            this.makeAjaxRequest1(aPayload, oJsonData);
        },

        // createValidatePOPayLoad: function (oJsonData) {
        //        var oGroupedData = {};
        //        var aPayload = [];

        //        oJsonData.forEach(function (row) {
        //            var prN   umber = row["PurchaseRequisition"];
        //            var supplier = row["FixedSupplier"];
        //            var groupKey = prNumber + "_" + supplier;

        //            if (!oGroupedData[groupKey]) {
        //                oGroupedData[groupKey] = {
        //                    PurchaseRequisition: prNumber,
        //                    FixedSupplier: supplier,
        //                    LineItems: []
        //                };
        //            }

        //            var oLineItem = {
        //                PurchaseRequisition: prNumber,
        //                PurchaseRequisitionItem: row["PurchaseRequisitionItem"],
        //                Material: row["Material"],
        //                RequestedQuantity: parseInt(row["RequestedQuantity"], 10),
        //                BaseUnit: row["BaseUnit"],
        //                PurchasingGroup: row["PurchasingGroup"],
        //                DeliveryDate: row["DeliveryDate"] || "", // Replace with actual value if available
        //                Plant: row["Plant"],
        //                StorageLocation: row["StorageLocation"],
        //                FixedSupplier: supplier,
        //                ERROR_MSG: row["Error"],
        //                PurReqCreationDate: row["PurReqCreationDate"],
        //                PurchasingInfoRecord: row["PurchasingInfoRecord"]
        //            };

        //            oGroupedData[groupKey].LineItems.push(oLineItem);
        //        });

        //        Object.keys(oGroupedData).forEach(function (groupKey) {
        //            var group = oGroupedData[groupKey];
        //            var oPayload = {
        //                "preq_no": group.PurchaseRequisition,
        //                "fixed_supplier": group.FixedSupplier,
        //                "_Item": group.LineItems.map(function (item) {
        //                    return {
        //                        "PREQ_NO": item.PurchaseRequisition,
        //                        "PRITEM_NO": item.PurchaseRequisitionItem,
        //                        "PIR_NO": item.PurchasingInfoRecord,
        //                        "ERROR_MSG": ""
        //                    };
        //                })
        //            };
        //            aPayload.push(oPayload);
        //        });

        //        console.log(aPayload);
        //        this.makeAjaxRequest1(aPayload, oJsonData);
        //    },


        makeAjaxRequest1: async function (aPayload, allItems) {
            var that = this;
            var oArray = allItems;
            var oValidateModel = this.getView().getModel("validationService");
            var oData = [];
            const sUpdateGroupId = "createPoValidateGroup";
            var iTotalRequests = aPayload.length;
            var iCompletedRequests = 0;
            var oTable = that.getView().byId("poTbl");
            var oNewPayload = [];
            for (var i = 0; i < aPayload.length; i++) {
                this.getView().byId("idProg").setVisible(true);
                var oContext1 = oValidateModel.bindContext("/ZPRLIST/com.sap.gateway.srvd.zui_pr_upload.v0001.ValidatePR(...)", null, {
                    // $$updateGroupId: sUpdateGroupId
                });
                oContext1.setParameter("preq_no", aPayload[i].preq_no);
                oContext1.setParameter("_Item", aPayload[i]._Item);
                try {
                    await oContext1.execute().then(function (oAction) {
                        iCompletedRequests++;
                        const fProgress = (iCompletedRequests / iTotalRequests) * 100;
                        that.getView().byId("idProg").setDisplayValue("Validating " + Math.round(fProgress) + "%");
                        that.getView().byId("idProg").setPercentValue(Math.round(fProgress));
                        var oActionContext = oContext1.getBoundContext();
                        var oResponse = oActionContext.getObject().value;
                        that.getView().byId("idColStatus").setVisible(true);
                        that.getView().byId("idErrorMsg").setVisible(true);
                        for (let i = 0; i < oResponse.length; i++) {
                            oData.push(oResponse[i]);

                            allItems[i].PurchaseRequisition = oResponse[i].PREQ_NO,
                                allItems[i].PurchaseRequisitionItem = oResponse[i].PRITEM_NO,
                                allItems[i].PurchasingInfoRecord = oResponse[i].PIR_NO,
                                allItems[i].ProcessingStatus = oResponse[i].STATUS,
                                allItems[i].ERROR_MSG = oResponse[i].ERROR_MSG
                            allItems[i].DeliveryDate = oResponse[i].DeliveryDate === "DeliveryDate" ? "" : oResponse[i].DeliveryDate;
                            oNewPayload.push(allItems[i]);

                        }
                        oTable.setVisible(true);
                        that.getView().setModel(new JSONModel(oNewPayload), "podata");
                        oValidateModel.refresh();
                    });
                }
                catch (error) {
                    MessageBox.error("Please enter valid excel data", {
                        onClose: function () {
                            var oProgress = this.getView().byId("idProg");
                            if (oProgress) {
                                oProgress.setState("None");
                                oProgress.setDisplayValue("");
                                oProgress.setPercentValue(0);
                            }
                        }.bind(this)
                    });
                    that.getView().byId("idProg").setState("Error");
                    that.getView().byId("idProg").setDisplayValue("Validation Failed...");
                }
                await oValidateModel.submitBatch(sUpdateGroupId);
                if (iTotalRequests === iCompletedRequests) {
                    this.onPOConvert(oArray);
                    this.getView().byId("idProg").setState("Success");
                    this.getView().byId("idProg").setDisplayValue("Validation Completed");
                }
            }
        },
        createPoPayload: function (aPayLoad) {
            var pPayLoad = [];
            var oGroupedData = {};
            var oLineItem;
            var that = this;
            var prNumber;

            var oGroupedData = {};
            // var pPayload = [];

            aPayLoad.forEach(function (row) {
                var prNumber = row["PurchaseRequisition"];
                var supplier = row["FixedSupplier"];
                var groupKey = prNumber + "_" + supplier;

                if (!oGroupedData[groupKey]) {
                    oGroupedData[groupKey] = {
                        PurchaseOrderType: "ZCNB",
                        CompanyCode: row["CompanyCode"],
                        PurchasingGroup: row["PurchasingGroup"],
                        Supplier: row["FixedSupplier"],
                        PurchasingOrganization: row["PurchasingOrganization"],
                        _PurchaseOrderItem: []
                    };
                }

                var oLineItem = {
                    Material: row["Material"],
                    Plant: row["Plant"],
                    PurchaseRequisition: row["PurchaseRequisition"],
                    PurchaseRequisitionItem: row["PurchaseRequisitionItem"],
                    OrderQuantity: parseInt(row["RequestedQuantity"]),
                    PurchaseOrderQuantityUnit: row["BaseUnit"],
                    // NetPriceAmount : row["PurchaseRequisitionPrice"],
                    // DocumentCurrency :row["PurReqnItemCurrency"],
                    StorageLocation: row["StorageLocation"]
                };

                oGroupedData[groupKey]._PurchaseOrderItem.push(oLineItem);
            });
            var oGroupData = [oGroupedData];


            for (let key in oGroupData[0]) {
                console.log(key, oGroupData[0]);
                pPayLoad.push(oGroupData[0][key]);
            }


            return pPayLoad;
            // Object.keys(oGroupedData).forEach(function (groupKey) {
            //     var group = oGroupedData[groupKey];
            //     var oPayload = {
            //         "preq_no": group.PurchaseRequisition,
            //         "fixed_supplier": group.FixedSupplier,
            //         "_PurchaseOrderItem": group.LineItems.map(function (item) {
            //             return {
            //                 "PREQ_NO": item.PurchaseRequisition,
            //                 "PRITEM_NO": item.PurchaseRequisitionItem,
            //                 "PIR_NO": item.PurchasingInfoRecord,
            //                 "ERROR_MSG": ""
            //             };
            //         })
            //     };
            //     aPayload.push(oPayload);
            // });





            // aPayLoad.forEach(function (row) {

            //      prNumber = row["PurchaseRequisition"];
            //     var supplier = row["FixedSupplier"];
            //     if (!oGroupedData[prNumber]) {
            //         oGroupedData[prNumber] = {
            //             PurchaseOrderType: "ZCNB",
            //             CompanyCode: row["CompanyCode"],
            //             PurchasingGroup: row["PurchasingGroup"],
            //             Supplier: row["FixedSupplier"],
            //             _PurchaseOrderItem : []
            //         };
            //     }
            //     oLineItem = {
            //         Material: row["Material"],
            //         Plant: row["Plant"],
            //         PurchaseRequisition: row["PurchaseRequisition"],
            //         PurchaseRequisitionItem: row["PurchaseRequisitionItem"],
            //         OrderQuantity : parseInt(row["RequestedQuantity"]),
            //         PurchaseOrderQuantityUnit : row["BaseUnit"],
            //         NetPriceAmount : row["PurchaseRequisitionPrice"],
            //         DocumentCurrency :row["PurReqnItemCurrency"]
            //     };
            //     console.log(oLineItem);
            //     oGroupedData[prNumber]._PurchaseOrderItem.push(oLineItem);
            // });
            // var oGroupData = [oGroupedData];





            // for (let key in oGroupData[0]) {
            //     console.log(key, oGroupData[0]);
            //     pPayLoad.push(oGroupData[0][key]);
            // }


            // return pPayLoad;
        }


    });
});