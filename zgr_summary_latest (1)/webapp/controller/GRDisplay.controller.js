sap.ui.loader.config({
    shim: {
        "com/sap/coupang/zgrsummary/util/xlsx": {
            amd: true, // When being required, UI5 temporarily disables the global `define` to allow the third party lib register its global name to `globalThis` or `window`.
            exports: "XLSX", // Name of the global variable under which SheetJS exports its module value
        },
    }
});
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "com/sap/coupang/zgrsummary/util/xlsx"
], (Controller, JSONModel, MessageBox, XLSX) => {
    "use strict";
    return Controller.extend("com.sap.coupang.zgrsummary.controller.GRDisplay", {
        onInit() {
            var oAppModel = new JSONModel({
                "count": 0,
            });
            this.getOwnerComponent().setModel(oAppModel, "AppModel");
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("GRDisplay").attachPatternMatched(this._onRouteMatched, this);
        },
        _onRouteMatched: function () {
            localStorage.setItem("NavigatedTo", "false");

            var savedFilters = JSON.parse(localStorage.getItem("FilterState"));
            if (!savedFilters) {
                MessageBox.warning("No filter data found.");
                return;
            }
            this._fetchTableData(savedFilters);
        },
        // _fetchTableData: function (filters) {
        //     var aFilters = [];

        //     // Add standard filters
        //     if (filters.CompanyCode) {
        //         aFilters.push("CompanyCode eq '" + filters.CompanyCode + "'");
        //     }
        //     if (filters.Plant) {
        //         aFilters.push("Plant eq '" + filters.Plant + "'");
        //     }
        //     if (filters.Supplier) {
        //         aFilters.push("Vendor eq '" + filters.Supplier + "'");
        //     }
        //     if (filters.PurchaseOrderType) {
        //         aFilters.push("POType eq '" + filters.PurchaseOrderType + "'");
        //     }
        //     if (filters.PurchaseOrder) {
        //         aFilters.push("PONumber eq '" + filters.PurchaseOrder + "'");
        //     }
        //     if (filters.PurchasingGroup) {
        //         aFilters.push("PurchasingGroup eq '" + filters.PurchasingGroup + "'");
        //     }
        //     if (filters.MaterialGroup) {
        //         aFilters.push("MaterialGroup eq '" + filters.MaterialGroup + "'");
        //     }
        //     if (filters.Material) {
        //         aFilters.push("Material eq '" + filters.Material + "'");
        //     }

        //     // Date range filters
        //     if (filters.POCreateDate && filters.POCreateDate.length === 1) {
        //         var podates = filters.POCreateDate[0].split(" - ");
        //         var sPODateFrom = podates[0];
        //         var sPODateTo = podates[1];
        //         aFilters.push("(POCreateDate ge " + sPODateFrom + " and POCreateDate le " + sPODateTo + ")");
        //     }

        //     if (filters.GoodReceiptDate && filters.GoodReceiptDate.length === 1) {
        //         var grdates = filters.GoodReceiptDate[0].split(" - ");
        //         var sGRDateFrom = grdates[0];
        //         var sGRDateTo = grdates[1];
        //         aFilters.push("(PostingDate ge " + sGRDateFrom + " and PostingDate le " + sGRDateTo + ")");
        //     }

        //     // MovementType filter logic
        //     let aMovementFilters = ["MovementType eq '101'", "MovementType eq '161'"];
        //     if (filters.IncludeCancellation) {
        //         aMovementFilters.push("MovementType eq '102'");
        //         aMovementFilters.push("MovementType eq '162'");
        //     }
        //     aFilters.push("(" + aMovementFilters.join(" or ") + ")");

        //     // Final filter query
        //     var sFilterQuery = aFilters.length > 0 ? `$filter=${aFilters.join(" and ")}` : "";

        //     // OData call
        //     var oModel = this.getOwnerComponent().getModel();
        //     var sUrl = oModel.sServiceUrl + "ZMM_CDS_GR_SUMMARY_4010?$top=20000&" + sFilterQuery;

        //     var that = this;
        //     $.ajax({
        //         type: "GET",
        //         url: sUrl,
        //         dataType: "json",
        //         contentType: "application/json; charset=utf-8",
        //         success: function (data) {
        //             var oTblModel = new sap.ui.model.json.JSONModel({ tblitems: data.value });
        //             that.getView().setModel(oTblModel, "tblModel");

        //             var oTable = that.getView().byId("displayGRTbl");
        //             oTable.setVisible(true);

        //             var iLen = data.value.length;
        //             that.getView().getModel("AppModel").setProperty("/count", iLen);
        //         },
        //         error: function () {
        //             MessageBox.error("Error fetching data from backend.");
        //         }
        //     });
        // },
        _fetchTableData: function (filters) {
            var aFilters = [];

            if (filters.CompanyCode) {
                aFilters.push("CompanyCode eq '" + filters.CompanyCode + "'");
            }
            if (filters.Plant) {
                aFilters.push("Plant eq '" + filters.Plant + "'");
            }
            if (filters.Supplier) {
                aFilters.push("Vendor eq '" + filters.Supplier + "'");
            }
            if (filters.PurchaseOrderType) {
                aFilters.push("POType eq '" + filters.PurchaseOrderType + "'");
            }
            if (filters.PurchaseOrder) {
                aFilters.push("PONumber eq '" + filters.PurchaseOrder + "'");
            }
            if (filters.PurchasingGroup) {
                aFilters.push("PurchasingGroup eq '" + filters.PurchasingGroup + "'");
            }
            if (filters.MaterialGroup) {
                aFilters.push("MaterialGroup eq '" + filters.MaterialGroup + "'");
            }
            if (filters.Material) {
                aFilters.push("Material eq '" + filters.Material + "'");
            }

            // Date filters
            if (filters.POCreateDate && filters.POCreateDate.length === 1) {
                var podates = filters.POCreateDate[0].split(" - ");
                aFilters.push("(POCreateDate ge " + podates[0] + " and POCreateDate le " + podates[1] + ")");
            }

            if (filters.GoodReceiptDate && filters.GoodReceiptDate.length === 1) {
                var grdates = filters.GoodReceiptDate[0].split(" - ");
                aFilters.push("(PostingDate ge " + grdates[0] + " and PostingDate le " + grdates[1] + ")");
            }

            // MovementType filter logic
            let aMovementFilters = ["MovementType eq '101'", "MovementType eq '161'"];
            if (filters.IncludeCancellation) {
                aMovementFilters.push("MovementType eq '102'");
                aMovementFilters.push("MovementType eq '162'");
            }
            aFilters.push("(" + aMovementFilters.join(" or ") + ")");

            var sFilterQuery = aFilters.length > 0 ? `$filter=${aFilters.join(" and ")}` : "";
            var oModel = this.getOwnerComponent().getModel();
            var sUrl = oModel.sServiceUrl + "ZMM_CDS_GR_SUMMARY_4010?$top=20000&" + sFilterQuery;

            var that = this;
            $.ajax({
                type: "GET",
                url: sUrl,
                dataType: "json",
                contentType: "application/json; charset=utf-8",
                success: function (data) {
                    let aItems = data.value;

                    // Sort cancellation rows to bottom if IncludeCancellation is true
                    if (filters.IncludeCancellation) {
                        aItems.sort(function (a, b) {
                            const cancelTypes = ['102', '162'];
                            const aIsCancel = cancelTypes.includes(a.MovementType);
                            const bIsCancel = cancelTypes.includes(b.MovementType);

                            if (aIsCancel && !bIsCancel) return 1;
                            if (!aIsCancel && bIsCancel) return -1;
                            return 0;
                        });
                    }

                    var oTblModel = new sap.ui.model.json.JSONModel({ tblitems: aItems });
                    that.getView().setModel(oTblModel, "tblModel");

                    var oTable = that.getView().byId("displayGRTbl");
                    oTable.setVisible(true);

                    that.getView().getModel("AppModel").setProperty("/count", aItems.length);
                },
                error: function () {
                    MessageBox.error("Error fetching data from backend.");
                }
            });
        },
        onExcelExport: function () {
            var oTable = this.byId("displayGRTbl");
            var sFileName = "GRSummaryList.xlsx";

            var aColumns = oTable.getColumns();
            var aExcelData = [];
            var aHeader = aColumns.map(function (column) {
                return column.getLabel().getText();
            });
            aExcelData.push(aHeader);

            var oBinding = oTable.getBinding("rows");
            var iRowCount = oBinding.getLength();

            for (var i = 0; i < iRowCount; i++) {
                var oContext = oTable.getContextByIndex(i);
                var aRowData = [];

                aColumns.forEach(function (column) {
                    var oTemplate = column.getTemplate();
                    var oBindingInfo = oTemplate.getBindingInfo("text");

                    if (oBindingInfo && oBindingInfo.parts && oBindingInfo.parts[0].path) {
                        var sPath = oBindingInfo.parts[0].path;
                        var sValue = oContext.getProperty(sPath);
                        aRowData.push(sValue);
                    } else {
                        aRowData.push("");
                    }
                });

                aExcelData.push(aRowData);
            }
            var ws = XLSX.utils.aoa_to_sheet(aExcelData);
            var wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "GRSummaryList");
            XLSX.writeFile(wb, sFileName);
        },

        onNavPurchaseOrder: function (oEvent) {
            localStorage.setItem("NavigatedTo", "true");
            var sPO = oEvent.getSource().getProperty("text")
            var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
            var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                target: {
                    semanticObject: "PurchaseOrder",
                    action: "display"
                },
                params: {
                    "PurchaseOrder": sPO
                }
            })) || "";
            oCrossAppNavigator.toExternal({
                target: {
                    shellHash: hash
                }
            });
        },
        onMigoPress: function (oEvent) {
            localStorage.setItem("NavigatedTo", "true");

            var oContext = oEvent.getSource().getBindingContext("tblModel");

            var sPO = oContext.getProperty("PONumber");
            var sPoItem = oContext.getProperty("POItem");

            var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
            var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
                target: {
                    semanticObject: "Material",
                    action: "postGoodsMovementInWebGUI"
                },
                params: {
                    "PO Number": sPO,
                    "PO Item": sPoItem
                }
            })) || "";

            oCrossAppNavigator.toExternal({
                target: {
                    shellHash: hash
                }
            });
        }
    });
});
